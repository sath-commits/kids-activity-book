'use client'

import { Document, Font } from '@react-pdf/renderer'
import { GeneratedBook } from '@/lib/types'
import CoverPage from './CoverPage'
import OathPage from './OathPage'
import ChecklistPage from './ChecklistPage'
import SectionActivityPage from './SectionActivityPage'
import SectionColoringPage from './SectionColoringPage'
import ScavengerHuntPage from './ScavengerHuntPage'
import BingoPage from './BingoPage'
import CrosswordPage from './CrosswordPage'
import BadgesPage from './BadgesPage'
import CertificatePage from './CertificatePage'
import AnswerKeyPage from './AnswerKeyPage'
import MapPage from './MapPage'
import WordSearchPage from './WordSearchPage'
import SillyChallengesPage from './SillyChallengesPage'
import SectionJournalPage from './SectionJournalPage'
import ConnectDotsPage from './ConnectDotsPage'
import MazePage from './MazePage'
import { buildCrossword } from '@/lib/crossword'
import { buildWordSearch } from '@/lib/wordSearch'
import { hashStr } from '@/lib/maze'

// Register fonts
Font.register({
  family: 'Nunito',
  fonts: [
    { src: '/fonts/Nunito-Regular.woff', fontWeight: 400, fontStyle: 'normal' },
    { src: '/fonts/Nunito-Italic.woff', fontWeight: 400, fontStyle: 'italic' },
    { src: '/fonts/Nunito-Bold.woff', fontWeight: 700, fontStyle: 'normal' },
    { src: '/fonts/Nunito-BoldItalic.woff', fontWeight: 700, fontStyle: 'italic' },
  ],
})

Font.register({
  family: 'Nunito-Bold',
  fonts: [
    { src: '/fonts/Nunito-Bold.woff', fontWeight: 700, fontStyle: 'normal' },
    { src: '/fonts/Nunito-BoldItalic.woff', fontWeight: 700, fontStyle: 'italic' },
  ],
})

interface BookPDFProps {
  book: GeneratedBook
}

export default function BookPDF({ book }: BookPDFProps) {
  const { content, coverImageUrl, sectionImageUrls, childPersonalization, destinationDisplayName, tripDates, places, mapImageB64 } = book
  const { sections, scavengerHuntItems, bingoGrid, badgeNames } = content

  const hasMap = !!mapImageB64 && Array.isArray(places) && places.length > 0
  const mapOffset = hasMap ? 1 : 0

  const crossword = content.crosswordWords ? buildCrossword(content.crosswordWords) : null
  const crosswordOffset = crossword && crossword.placedWords.length > 0 ? 1 : 0

  const wordSearch = content.crosswordWords && content.crosswordWords.length > 0
    ? buildWordSearch(content.crosswordWords.map(w => w.word))
    : null
  const wordSearchOffset = wordSearch && wordSearch.placedWords.length > 0 ? 1 : 0

  // Second word search using section titles and badge names as words
  const wordSearch2Words = [
    ...sections.map(s => s.title.split(/\s+/)).flat(),
    ...(badgeNames ?? []).map(b => b.split(/\s+/)[0]),
  ].map(w => w.toUpperCase().replace(/[^A-Z]/g, '')).filter(w => w.length >= 3 && w.length <= 12)

  const wordSearch2 = wordSearch2Words.length >= 4
    ? buildWordSearch(wordSearch2Words)
    : null
  const wordSearch2Offset = wordSearch2 && wordSearch2.placedWords.length > 0 ? 1 : 0

  const mazeSeed = hashStr(destinationDisplayName)

  const hasSillyChallenges = Array.isArray(content.sillyChallenges) && content.sillyChallenges.length > 0
  const sillyChallengesOffset = hasSillyChallenges ? 1 : 0

  return (
    <Document
      title={`${destinationDisplayName} Junior Explorer Adventure`}
      author="Little Explorer · builtthisweekend.com"
    >
      {/* Cover */}
      <CoverPage
        destinationDisplayName={destinationDisplayName}
        explorers={childPersonalization}
        tripDates={tripDates}
        coverImageUrl={coverImageUrl}
      />

      {/* Oath */}
      <OathPage pageNumber={2} />

      {/* Map (only when itinerary was provided) */}
      {hasMap && (
        <MapPage
          destinationDisplayName={destinationDisplayName}
          places={places!}
          mapImageB64={mapImageB64!}
          destinationIntro={content.destinationIntro}
          pageNumber={3}
        />
      )}

      {/* Checklist */}
      <ChecklistPage
        destinationDisplayName={destinationDisplayName}
        sections={sections}
        badgeNames={badgeNames}
        pageNumber={3 + mapOffset}
      />

      {/* Sections: activity + coloring + journal page triples */}
      {sections.flatMap((section, i) => {
        const childIdx = i % childPersonalization.length
        const child = childPersonalization[childIdx]
        const imageUrl = sectionImageUrls?.[i] ?? null
        const activityPageNum = 4 + mapOffset + i * 3
        const coloringPageNum = activityPageNum + 1
        const journalPageNum = activityPageNum + 2
        return [
          <SectionActivityPage
            key={`activity-${section.id}`}
            section={section}
            childPersonalization={child}
            pageNumber={activityPageNum}
          />,
          <SectionColoringPage
            key={`coloring-${section.id}`}
            section={section}
            imageUrl={imageUrl}
            pageNumber={coloringPageNum}
          />,
          <SectionJournalPage
            key={`journal-${section.id}`}
            sectionTitle={section.title}
            pageNumber={journalPageNum}
          />,
        ]
      })}

      {/* Scavenger Hunt */}
      <ScavengerHuntPage
        items={scavengerHuntItems}
        destinationDisplayName={destinationDisplayName}
        pageNumber={4 + mapOffset + sections.length * 3}
      />

      {/* Bingo */}
      <BingoPage
        gridItems={bingoGrid}
        destinationDisplayName={destinationDisplayName}
        pageNumber={5 + mapOffset + sections.length * 3}
      />

      {/* Crossword */}
      {crossword && crossword.placedWords.length > 0 && (
        <CrosswordPage
          crossword={crossword}
          pageNumber={6 + mapOffset + sections.length * 3}
        />
      )}

      {/* Word Search */}
      {wordSearch && wordSearch.placedWords.length > 0 && (
        <WordSearchPage
          wordSearch={wordSearch}
          destinationDisplayName={destinationDisplayName}
          pageNumber={6 + mapOffset + sections.length * 3 + crosswordOffset}
        />
      )}

      {/* Word Search 2 */}
      {wordSearch2 && wordSearch2.placedWords.length > 0 && (
        <WordSearchPage
          wordSearch={wordSearch2}
          destinationDisplayName={destinationDisplayName}
          pageNumber={6 + mapOffset + sections.length * 3 + crosswordOffset + wordSearchOffset}
        />
      )}

      {/* Connect the Dots */}
      <ConnectDotsPage
        destinationDisplayName={destinationDisplayName}
        pageNumber={6 + mapOffset + sections.length * 3 + crosswordOffset + wordSearchOffset + wordSearch2Offset}
      />

      {/* Maze 1 */}
      <MazePage
        seed={mazeSeed}
        mazeIndex={1}
        pageNumber={7 + mapOffset + sections.length * 3 + crosswordOffset + wordSearchOffset + wordSearch2Offset}
      />

      {/* Maze 2 */}
      <MazePage
        seed={mazeSeed}
        mazeIndex={2}
        pageNumber={8 + mapOffset + sections.length * 3 + crosswordOffset + wordSearchOffset + wordSearch2Offset}
      />

      {/* Silly Challenges */}
      {hasSillyChallenges && (
        <SillyChallengesPage
          challenges={content.sillyChallenges!}
          destinationDisplayName={destinationDisplayName}
          pageNumber={9 + mapOffset + sections.length * 3 + crosswordOffset + wordSearchOffset + wordSearch2Offset}
        />
      )}

      {/* Badges */}
      <BadgesPage
        sections={sections}
        badgeNames={badgeNames}
        pageNumber={9 + mapOffset + sections.length * 3 + crosswordOffset + wordSearchOffset + wordSearch2Offset + sillyChallengesOffset}
      />

      {/* Certificates — one per child */}
      {childPersonalization.map((child, i) => (
        <CertificatePage
          key={`cert-${child.name}`}
          child={child}
          destinationDisplayName={destinationDisplayName}
          pageNumber={10 + mapOffset + sections.length * 3 + crosswordOffset + wordSearchOffset + wordSearch2Offset + sillyChallengesOffset + i}
        />
      ))}

      {/* Answer Key */}
      <AnswerKeyPage
        sections={sections}
        pageNumber={10 + mapOffset + sections.length * 3 + crosswordOffset + wordSearchOffset + wordSearch2Offset + sillyChallengesOffset + childPersonalization.length}
      />
    </Document>
  )
}
