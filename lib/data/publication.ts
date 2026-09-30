/**
 * Content data — the IEEE paper's full record, from the publisher (Crossref
 * for DOI 10.1109/ICEECCOT52851.2021.9707992, checked Sep 30 2026). Read only
 * by server code (the "Copy the citation" text, the CV's structured data),
 * so none of it reaches the client bundle. Title, venue, DOI and link stay
 * in profile.publication.
 */

export const publicationRecord = {
  /** Every author, in the publisher's order. */
  authors: [
    'D S Jayalakshmi',
    'J Geetha',
    'Abhishek Sen',
    'Amit Kumar Dubey',
    'Darshan R Konnur',
    'S Priya',
  ],
  booktitle:
    '2021 5th International Conference on Electrical, Electronics, Communication, Computer Technologies and Optimization Techniques (ICEECCOT)',
  year: 2021,
  pages: '27--32',
} as const
