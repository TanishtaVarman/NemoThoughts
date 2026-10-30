import type { Subject } from './types';

export const SUBJECTS: Subject[] = [
  {
    id: 'cpp',
    name: 'C++ Programming',
    code: 'CS 201',
    lessons: ['Functions & Scope', 'Pointers & References', 'Classes & Objects', 'STL Containers', 'Memory Management'],
    prompts: [
      'What is the difference between a pointer and a reference?',
      'Why does my function not change the variable I pass in?',
      'When should I pass by const reference?',
      'Explain the rule of three with a short example.',
    ],
  },
  {
    id: 'geometry',
    name: 'Coordinate Geometry',
    code: 'MATH 120',
    lessons: ['Distance & Midpoint', 'Slopes & Lines', 'Circles', 'Section Formula', '3D Coordinates'],
    prompts: [
      'How does the distance formula extend to 3D?',
      'What happens to the distance when a coordinate is negative?',
      'How do I tell if two lines are perpendicular?',
      'Derive the equation of a circle from the distance formula.',
    ],
  },
  {
    id: 'history',
    name: 'Modern History',
    code: 'HIST 210',
    lessons: ['French Revolution', 'Industrial Revolution', 'World War I', 'Interwar Period', 'Cold War'],
    prompts: [
      'What were the three estates in pre-revolutionary France?',
      'Why did the Industrial Revolution start in Britain?',
      'Summarise the long-term causes of World War I.',
      'What was the policy of containment?',
    ],
  },
  {
    id: 'physics',
    name: 'Classical Physics',
    code: 'PHYS 101',
    lessons: ['Kinematics', "Newton's Laws", 'Work & Energy', 'Momentum', 'Circular Motion'],
    prompts: [
      'What is the difference between speed and velocity?',
      "Why doesn't Newton's third law cancel all motion?",
      'When is mechanical energy conserved?',
      'Where does centripetal force come from in a car turning a corner?',
    ],
  },
  {
    id: 'law',
    name: 'Criminal Law',
    code: 'LAW 230',
    lessons: ['Actus Reus', 'Mens Rea', 'Causation', 'Defences', 'Inchoate Offences'],
    prompts: [
      'What is the difference between direct and oblique intent?',
      'When can an omission amount to actus reus?',
      'How does a novus actus interveniens break the chain of causation?',
      'Distinguish duress from necessity.',
    ],
  },
];

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}
