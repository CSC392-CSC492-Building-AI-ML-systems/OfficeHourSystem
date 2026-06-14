interface FieldCharLimitHintProps {
  maxLength: number;
}

export function FieldCharLimitHint({ maxLength }: FieldCharLimitHintProps) {
  return (
    <p className="mt-1 text-xs text-slate-500">
      Maximum {maxLength} characters.
    </p>
  );
}
