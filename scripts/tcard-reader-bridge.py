#!/usr/bin/env python3
"""Read TCard UIDs through PC/SC and type them into the focused application."""

import argparse
import ctypes
import ctypes.util
import os
import sys
import time


SCARD_SCOPE_USER = 0
SCARD_SHARE_SHARED = 2
SCARD_PROTOCOL_T0 = 1
SCARD_PROTOCOL_T1 = 2
SCARD_LEAVE_CARD = 0
SCARD_E_NO_SMARTCARD = 0x8010000C
SCARD_W_REMOVED_CARD = 0x80100069


class CardUnavailable(Exception):
    pass


def unsigned_code(result: int) -> int:
    return int(result) & 0xFFFFFFFF


def format_hex(data):
    return " ".join("%02X" % value for value in data)


class PcscUidReader:
    """Small common interface for the Windows and PC/SC-Lite implementations."""

    reader_name: str

    def read_uid(self) -> bytes:
        raise NotImplementedError

    def close(self) -> None:
        raise NotImplementedError


def contactless_readers(readers, hint):
    if not readers:
        raise RuntimeError("No PC/SC readers found")
    if hint:
        matches = [name for name in readers if hint.lower() in name.lower()]
        if not matches:
            raise RuntimeError(
                'No PC/SC reader matched "' + hint + "\". Found: " + ", ".join(readers)
            )
        return matches

    picc_readers = [name for name in readers if "picc" in name.lower()]
    other_readers = [
        name
        for name in readers
        if "sam" not in name.lower() and name not in picc_readers
    ]
    matches = picc_readers + other_readers
    if not matches:
        raise RuntimeError(
            "No contactless PC/SC reader available. Found: " + ", ".join(readers)
        )
    return matches


if os.name == "nt":
    from ctypes import wintypes

    INPUT_KEYBOARD = 1
    KEYEVENTF_KEYUP = 0x0002
    KEYEVENTF_UNICODE = 0x0004
    VK_RETURN = 0x0D

    class ScardIoRequest(ctypes.Structure):
        _fields_ = [
            ("dwProtocol", wintypes.DWORD),
            ("cbPciLength", wintypes.DWORD),
        ]

    class KeyboardInput(ctypes.Structure):
        _fields_ = [
            ("wVk", wintypes.WORD),
            ("wScan", wintypes.WORD),
            ("dwFlags", wintypes.DWORD),
            ("time", wintypes.DWORD),
            ("dwExtraInfo", wintypes.WPARAM),
        ]

    class MouseInput(ctypes.Structure):
        _fields_ = [
            ("dx", wintypes.LONG),
            ("dy", wintypes.LONG),
            ("mouseData", wintypes.DWORD),
            ("dwFlags", wintypes.DWORD),
            ("time", wintypes.DWORD),
            ("dwExtraInfo", wintypes.WPARAM),
        ]

    class HardwareInput(ctypes.Structure):
        _fields_ = [
            ("uMsg", wintypes.DWORD),
            ("wParamL", wintypes.WORD),
            ("wParamH", wintypes.WORD),
        ]

    class InputUnion(ctypes.Union):
        _fields_ = [
            ("mi", MouseInput),
            ("ki", KeyboardInput),
            ("hi", HardwareInput),
        ]

    class Input(ctypes.Structure):
        _anonymous_ = ("value",)
        _fields_ = [("type", wintypes.DWORD), ("value", InputUnion)]

    class WindowsPcscUidReader(PcscUidReader):
        def __init__(self, reader_hint: str) -> None:
            self.api = ctypes.WinDLL("winscard")
            self.context = ctypes.c_void_p()
            self._configure_api()
            self._check(
                self.api.SCardEstablishContext(
                    SCARD_SCOPE_USER, None, None, ctypes.byref(self.context)
                ),
                "SCardEstablishContext",
            )
            self.reader_names = self._find_readers(reader_hint)
            self.reader_name = self.reader_names[0]

        def _configure_api(self) -> None:
            handle = ctypes.c_void_p
            self.api.SCardEstablishContext.argtypes = [
                wintypes.DWORD,
                ctypes.c_void_p,
                ctypes.c_void_p,
                ctypes.POINTER(handle),
            ]
            self.api.SCardEstablishContext.restype = wintypes.LONG
            self.api.SCardListReadersW.argtypes = [
                handle,
                wintypes.LPCWSTR,
                wintypes.LPWSTR,
                ctypes.POINTER(wintypes.DWORD),
            ]
            self.api.SCardListReadersW.restype = wintypes.LONG
            self.api.SCardConnectW.argtypes = [
                handle,
                wintypes.LPCWSTR,
                wintypes.DWORD,
                wintypes.DWORD,
                ctypes.POINTER(handle),
                ctypes.POINTER(wintypes.DWORD),
            ]
            self.api.SCardConnectW.restype = wintypes.LONG
            self.api.SCardTransmit.argtypes = [
                handle,
                ctypes.POINTER(ScardIoRequest),
                ctypes.POINTER(ctypes.c_ubyte),
                wintypes.DWORD,
                ctypes.c_void_p,
                ctypes.POINTER(ctypes.c_ubyte),
                ctypes.POINTER(wintypes.DWORD),
            ]
            self.api.SCardTransmit.restype = wintypes.LONG
            self.api.SCardDisconnect.argtypes = [handle, wintypes.DWORD]
            self.api.SCardReleaseContext.argtypes = [handle]

        def _check(self, result: int, operation: str) -> None:
            if result != 0:
                raise RuntimeError(
                    f"{operation} failed: 0x{unsigned_code(result):08X}"
                )

        def _find_readers(self, hint: str):
            length = wintypes.DWORD()
            self._check(
                self.api.SCardListReadersW(
                    self.context, None, None, ctypes.byref(length)
                ),
                "SCardListReadersW",
            )
            buffer = ctypes.create_unicode_buffer(length.value)
            self._check(
                self.api.SCardListReadersW(
                    self.context, None, buffer, ctypes.byref(length)
                ),
                "SCardListReadersW",
            )
            readers = [name for name in buffer[: length.value].split("\0") if name]
            return contactless_readers(readers, hint)

        def read_uid(self) -> bytes:
            for reader_name in self.reader_names:
                self.reader_name = reader_name
                try:
                    return self._read_uid(reader_name)
                except CardUnavailable:
                    continue
            raise CardUnavailable

        def _read_uid(self, reader_name: str) -> bytes:
            card = ctypes.c_void_p()
            protocol = wintypes.DWORD()
            result = self.api.SCardConnectW(
                self.context,
                reader_name,
                SCARD_SHARE_SHARED,
                SCARD_PROTOCOL_T0 | SCARD_PROTOCOL_T1,
                ctypes.byref(card),
                ctypes.byref(protocol),
            )
            if unsigned_code(result) in {SCARD_E_NO_SMARTCARD, SCARD_W_REMOVED_CARD}:
                raise CardUnavailable
            self._check(result, "SCardConnectW")

            try:
                command_bytes = bytes.fromhex("FF CA 00 00 00")
                command = (ctypes.c_ubyte * len(command_bytes)).from_buffer_copy(
                    command_bytes
                )
                response = (ctypes.c_ubyte * 64)()
                response_length = wintypes.DWORD(len(response))
                pci = ScardIoRequest(protocol.value, ctypes.sizeof(ScardIoRequest))
                self._check(
                    self.api.SCardTransmit(
                        card,
                        ctypes.byref(pci),
                        command,
                        len(command_bytes),
                        None,
                        response,
                        ctypes.byref(response_length),
                    ),
                    "SCardTransmit",
                )
                payload = bytes(response[: response_length.value])
                if len(payload) < 3 or payload[-2:] != b"\x90\x00":
                    raise RuntimeError(
                        "Get UID returned status " + format_hex(payload[-2:])
                    )
                return payload[:-2]
            finally:
                self.api.SCardDisconnect(card, SCARD_LEAVE_CARD)

        def close(self) -> None:
            if self.context:
                self.api.SCardReleaseContext(self.context)
                self.context = ctypes.c_void_p()

    def keyboard_input(vk: int, scan: int, flags: int) -> Input:
        return Input(
            type=INPUT_KEYBOARD,
            value=InputUnion(
                ki=KeyboardInput(
                    wVk=vk,
                    wScan=scan,
                    dwFlags=flags,
                    time=0,
                    dwExtraInfo=0,
                )
            ),
        )

    class WindowsKeyboardTyper:
        def type_text(self, text: str) -> None:
            events = []
            for character in text:
                events.append(keyboard_input(0, ord(character), KEYEVENTF_UNICODE))
                events.append(
                    keyboard_input(
                        0, ord(character), KEYEVENTF_UNICODE | KEYEVENTF_KEYUP
                    )
                )
            events.append(keyboard_input(VK_RETURN, 0, 0))
            events.append(keyboard_input(VK_RETURN, 0, KEYEVENTF_KEYUP))

            event_array = (Input * len(events))(*events)
            user32 = ctypes.WinDLL("user32", use_last_error=True)
            user32.SendInput.argtypes = [
                wintypes.UINT,
                ctypes.POINTER(Input),
                ctypes.c_int,
            ]
            user32.SendInput.restype = wintypes.UINT
            ctypes.set_last_error(0)
            sent = user32.SendInput(
                len(event_array), event_array, ctypes.sizeof(Input)
            )
            if sent != len(event_array):
                error = ctypes.get_last_error()
                raise RuntimeError(
                    f"SendInput sent {sent} of {len(event_array)} events "
                    f"(Win32 error {error})"
                )

        def close(self) -> None:
            pass


if sys.platform.startswith("linux"):
    import fcntl

    DWORD = ctypes.c_uint32
    LONG = ctypes.c_int32
    SCARDHANDLE = ctypes.c_ulong

    EV_SYN = 0x00
    EV_KEY = 0x01
    SYN_REPORT = 0
    KEY_ENTER = 28
    KEY_SPACE = 57

    LINUX_KEY_CODES = {
        "1": 2,
        "2": 3,
        "3": 4,
        "4": 5,
        "5": 6,
        "6": 7,
        "7": 8,
        "8": 9,
        "9": 10,
        "0": 11,
        "A": 30,
        "B": 48,
        "C": 46,
        "D": 32,
        "E": 18,
        "F": 33,
        " ": KEY_SPACE,
    }

    class LinuxScardIoRequest(ctypes.Structure):
        _fields_ = [("dwProtocol", DWORD), ("cbPciLength", DWORD)]

    class LinuxPcscUidReader(PcscUidReader):
        def __init__(self, reader_hint: str) -> None:
            library = ctypes.util.find_library("pcsclite") or "libpcsclite.so.1"
            self.api = ctypes.CDLL(library)
            self.context = SCARDHANDLE()
            self._configure_api()
            self._check(
                self.api.SCardEstablishContext(
                    SCARD_SCOPE_USER, None, None, ctypes.byref(self.context)
                ),
                "SCardEstablishContext",
            )
            self.reader_names = self._find_readers(reader_hint)
            self.reader_name = self.reader_names[0]

        def _configure_api(self) -> None:
            self.api.SCardEstablishContext.argtypes = [
                DWORD,
                ctypes.c_void_p,
                ctypes.c_void_p,
                ctypes.POINTER(SCARDHANDLE),
            ]
            self.api.SCardEstablishContext.restype = LONG
            self.api.SCardListReaders.argtypes = [
                SCARDHANDLE,
                ctypes.c_char_p,
                ctypes.c_char_p,
                ctypes.POINTER(DWORD),
            ]
            self.api.SCardListReaders.restype = LONG
            self.api.SCardConnect.argtypes = [
                SCARDHANDLE,
                ctypes.c_char_p,
                DWORD,
                DWORD,
                ctypes.POINTER(SCARDHANDLE),
                ctypes.POINTER(DWORD),
            ]
            self.api.SCardConnect.restype = LONG
            self.api.SCardTransmit.argtypes = [
                SCARDHANDLE,
                ctypes.POINTER(LinuxScardIoRequest),
                ctypes.POINTER(ctypes.c_ubyte),
                DWORD,
                ctypes.c_void_p,
                ctypes.POINTER(ctypes.c_ubyte),
                ctypes.POINTER(DWORD),
            ]
            self.api.SCardTransmit.restype = LONG
            self.api.SCardDisconnect.argtypes = [SCARDHANDLE, DWORD]
            self.api.SCardReleaseContext.argtypes = [SCARDHANDLE]

        def _check(self, result: int, operation: str) -> None:
            if result != 0:
                raise RuntimeError(
                    f"{operation} failed: 0x{unsigned_code(result):08X}"
                )

        def _find_readers(self, hint: str):
            length = DWORD()
            self._check(
                self.api.SCardListReaders(
                    self.context, None, None, ctypes.byref(length)
                ),
                "SCardListReaders",
            )
            buffer = ctypes.create_string_buffer(length.value)
            self._check(
                self.api.SCardListReaders(
                    self.context, None, buffer, ctypes.byref(length)
                ),
                "SCardListReaders",
            )
            readers = [
                name.decode("utf-8", errors="replace")
                for name in buffer.raw[: length.value].split(b"\0")
                if name
            ]
            return contactless_readers(readers, hint)

        def read_uid(self) -> bytes:
            for reader_name in self.reader_names:
                self.reader_name = reader_name
                try:
                    return self._read_uid(reader_name)
                except CardUnavailable:
                    continue
            raise CardUnavailable

        def _read_uid(self, reader_name: str) -> bytes:
            card = SCARDHANDLE()
            protocol = DWORD()
            result = self.api.SCardConnect(
                self.context,
                reader_name.encode("utf-8"),
                SCARD_SHARE_SHARED,
                SCARD_PROTOCOL_T0 | SCARD_PROTOCOL_T1,
                ctypes.byref(card),
                ctypes.byref(protocol),
            )
            if unsigned_code(result) in {SCARD_E_NO_SMARTCARD, SCARD_W_REMOVED_CARD}:
                raise CardUnavailable
            self._check(result, "SCardConnect")

            try:
                command_bytes = bytes.fromhex("FF CA 00 00 00")
                command = (ctypes.c_ubyte * len(command_bytes)).from_buffer_copy(
                    command_bytes
                )
                response = (ctypes.c_ubyte * 64)()
                response_length = DWORD(len(response))
                pci = LinuxScardIoRequest(
                    protocol.value, ctypes.sizeof(LinuxScardIoRequest)
                )
                self._check(
                    self.api.SCardTransmit(
                        card,
                        ctypes.byref(pci),
                        command,
                        len(command_bytes),
                        None,
                        response,
                        ctypes.byref(response_length),
                    ),
                    "SCardTransmit",
                )
                payload = bytes(response[: response_length.value])
                if len(payload) < 3 or payload[-2:] != b"\x90\x00":
                    raise RuntimeError(
                        "Get UID returned status " + format_hex(payload[-2:])
                    )
                return payload[:-2]
            finally:
                self.api.SCardDisconnect(card, SCARD_LEAVE_CARD)

        def close(self) -> None:
            if self.context:
                self.api.SCardReleaseContext(self.context)
                self.context = SCARDHANDLE()

    def _ioc(direction: int, ioctl_type: int, number: int, size: int) -> int:
        return (direction << 30) | (size << 16) | (ioctl_type << 8) | number

    def _iow(ioctl_type: int, number: int, size: int) -> int:
        return _ioc(1, ioctl_type, number, size)

    def _io(ioctl_type: int, number: int) -> int:
        return _ioc(0, ioctl_type, number, 0)

    UI_SET_EVBIT = _iow(ord("U"), 100, ctypes.sizeof(ctypes.c_int))
    UI_SET_KEYBIT = _iow(ord("U"), 101, ctypes.sizeof(ctypes.c_int))
    UI_DEV_CREATE = _io(ord("U"), 1)
    UI_DEV_DESTROY = _io(ord("U"), 2)

    class InputId(ctypes.Structure):
        _fields_ = [
            ("bustype", ctypes.c_ushort),
            ("vendor", ctypes.c_ushort),
            ("product", ctypes.c_ushort),
            ("version", ctypes.c_ushort),
        ]

    class UinputUserDev(ctypes.Structure):
        _fields_ = [
            ("name", ctypes.c_char * 80),
            ("id", InputId),
            ("ff_effects_max", ctypes.c_uint32),
            ("absmax", ctypes.c_int32 * 64),
            ("absmin", ctypes.c_int32 * 64),
            ("absfuzz", ctypes.c_int32 * 64),
            ("absflat", ctypes.c_int32 * 64),
        ]

    class InputEvent(ctypes.Structure):
        _fields_ = [
            ("tv_sec", ctypes.c_long),
            ("tv_usec", ctypes.c_long),
            ("type", ctypes.c_ushort),
            ("code", ctypes.c_ushort),
            ("value", ctypes.c_int32),
        ]

    class LinuxKeyboardTyper:
        def __init__(self) -> None:
            try:
                self.fd = os.open("/dev/uinput", os.O_WRONLY | os.O_NONBLOCK)
            except OSError as error:
                raise RuntimeError(
                    "Cannot open /dev/uinput. Run with permission to access the "
                    "uinput device (or use sudo for an initial test)."
                ) from error

            try:
                fcntl.ioctl(self.fd, UI_SET_EVBIT, EV_KEY)
                for key_code in {*LINUX_KEY_CODES.values(), KEY_ENTER}:
                    fcntl.ioctl(self.fd, UI_SET_KEYBIT, key_code)

                device = UinputUserDev()
                device.name = b"HourSpace TCard Bridge"
                device.id = InputId(bustype=0x03, vendor=0x072F, product=0x223B, version=1)
                os.write(self.fd, bytes(device))
                fcntl.ioctl(self.fd, UI_DEV_CREATE)
                time.sleep(0.15)
            except Exception:
                os.close(self.fd)
                raise

        def _emit(self, event_type: int, code: int, value: int) -> None:
            event = InputEvent(0, 0, event_type, code, value)
            os.write(self.fd, bytes(event))

        def _press(self, key_code: int) -> None:
            self._emit(EV_KEY, key_code, 1)
            self._emit(EV_SYN, SYN_REPORT, 0)
            self._emit(EV_KEY, key_code, 0)
            self._emit(EV_SYN, SYN_REPORT, 0)

        def type_text(self, text: str) -> None:
            for character in text:
                key_code = LINUX_KEY_CODES.get(character)
                if key_code is None:
                    raise RuntimeError(
                        f"Linux keyboard backend cannot type {character!r}"
                    )
                self._press(key_code)
            self._press(KEY_ENTER)

        def close(self) -> None:
            if getattr(self, "fd", None) is not None:
                try:
                    fcntl.ioctl(self.fd, UI_DEV_DESTROY)
                finally:
                    os.close(self.fd)
                    self.fd = None


def create_reader(reader_hint: str) -> PcscUidReader:
    if os.name == "nt":
        return WindowsPcscUidReader(reader_hint)
    if sys.platform.startswith("linux"):
        return LinuxPcscUidReader(reader_hint)
    raise RuntimeError("This bridge supports Windows and Linux only.")


def create_keyboard_typer():
    if os.name == "nt":
        return WindowsKeyboardTyper()
    if sys.platform.startswith("linux"):
        return LinuxKeyboardTyper()
    raise RuntimeError("This bridge supports Windows and Linux only.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Type ACR1252 TCard UIDs into the focused application."
    )
    parser.add_argument(
        "--reader",
        default="",
        help="Optional PC/SC reader name substring.",
    )
    parser.add_argument(
        "--poll-ms", type=int, default=50, help="Reader polling interval."
    )
    parser.add_argument(
        "--reconnect-delay",
        type=float,
        default=0.25,
        help="Seconds to wait before reconnecting after a reader error.",
    )
    parser.add_argument(
        "--startup-delay",
        type=float,
        default=0,
        help="Optional delay before listening for cards (default: 0).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the UID instead of sending keyboard input.",
    )
    parser.add_argument(
        "--once", action="store_true", help="Exit after reading one card."
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    delay = max(args.poll_ms, 50) / 1000
    reconnect_delay = max(args.reconnect_delay, 0.25)
    reader = None
    typer = None if args.dry_run else create_keyboard_typer()
    armed = True

    if args.dry_run:
        print("Dry run: UID will be printed and no keys will be sent.")
    else:
        if args.startup_delay > 0:
            time.sleep(args.startup_delay)
        print("Ready. Focus the target input and tap a card. Press Ctrl+C to stop.")

    try:
        while True:
            if reader is None:
                try:
                    reader = create_reader(args.reader)
                    armed = True
                    print(f"Reader: {reader.reader_name}")
                except Exception as error:
                    print(
                        f"Reader unavailable ({error}). Retrying in "
                        f"{reconnect_delay:g}s...",
                        file=sys.stderr,
                    )
                    time.sleep(reconnect_delay)
                    continue

            try:
                uid = reader.read_uid()
            except CardUnavailable:
                armed = True
                time.sleep(delay)
                continue
            except Exception as error:
                print(
                    f"Reader error ({error}). Reconnecting in "
                    f"{reconnect_delay:g}s...",
                    file=sys.stderr,
                )
                reader.close()
                reader = None
                time.sleep(reconnect_delay)
                continue

            if armed:
                raw_uid = format_hex(uid)
                if args.dry_run:
                    print(f"UID={raw_uid}")
                else:
                    try:
                        typer.type_text(raw_uid)
                        print("Card read and sent. Remove the card before the next tap.")
                    except Exception as error:
                        print(
                            f"Keyboard input failed ({error}). The bridge will keep "
                            "running; remove the card before retrying.",
                            file=sys.stderr,
                        )
                armed = False
                if args.once:
                    return 0

            time.sleep(delay)
    except KeyboardInterrupt:
        print("\nStopped.")
        return 0
    finally:
        if reader is not None:
            reader.close()
        if typer is not None:
            typer.close()


if __name__ == "__main__":
    raise SystemExit(main())
