export interface StaffMember {
  id: string;
  name: string;
  program: string;
  role: "Lead TA" | "TA";
  email: string;
  location: string;
  isRemote: boolean;
}

export const DUMMY_STAFF: StaffMember[] = [
  {
    id: "1",
    name: "Sarah Chen",
    program: "Grad Student",
    role: "Lead TA",
    email: "s.chen@university.edu",
    location: "Tech Plaza, Rm 402",
    isRemote: false,
  },
  {
    id: "2",
    name: "Marcus Holloway",
    program: "Senior Undergraduate",
    role: "TA",
    email: "m.holloway@university.edu",
    location: "Science Center, Lab 1B",
    isRemote: false,
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    program: "Masters Student",
    role: "TA",
    email: "e.rodriguez@university.edu",
    location: "Remote (Zoom)",
    isRemote: true,
  },
];
