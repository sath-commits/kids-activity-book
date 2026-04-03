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
import SudokuPage from './SudokuPage'
import CryptogramPage from './CryptogramPage'
import TravelTriviaPage from './TravelTriviaPage'
import TravelMenuPage from './TravelMenuPage'
import LogicGridPage from './LogicGridPage'
import RebusPuzzlePage from './RebusPuzzlePage'
import ComicStripPage from './ComicStripPage'
import TopFivePage from './TopFivePage'
import MapDrawingPage from './MapDrawingPage'
import TimeCapsulePage from './TimeCapsulePage'
import { buildCrossword } from '@/lib/crossword'
import { buildWordSearch } from '@/lib/wordSearch'
import { hashStr } from '@/lib/maze'
import { generateSudoku, SudokuDifficulty } from '@/lib/sudoku'

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

  const crossword = content.crosswordWords ? buildCrossword(content.crosswordWords) : null

  const wordSearch = content.crosswordWords && content.crosswordWords.length > 0
    ? buildWordSearch(content.crosswordWords.map(w => w.word))
    : null

  // Second word search using section titles and badge names as words
  const wordSearch2Words = [
    ...sections.map(s => s.title.split(/\s+/)).flat(),
    ...(badgeNames ?? []).map(b => b.split(/\s+/)[0]),
  ].map(w => w.toUpperCase().replace(/[^A-Z]/g, '')).filter(w => w.length >= 3 && w.length <= 12)
  const wordSearch2 = wordSearch2Words.length >= 4 ? buildWordSearch(wordSearch2Words) : null

  const seed = hashStr(destinationDisplayName)

  // Age-gated page selection — use the OLDEST child's age as the ceiling
  // so every child in the group has something challenging enough for them.
  const maxAge = childPersonalization.length > 0
    ? Math.max(...childPersonalization.map(c => c.age))
    : 8

  // Age thresholds for each page type:
  // Always (any age):   Bingo, Scavenger Hunt, Silly Challenges, Comic Strip,
  //                     Map Drawing, Travel Menu, Top 5, Connect Dots, Maze 1
  // 5+:                 Time Capsule Letter
  // 6+:                 Word Search, Travel Trivia, Rebus Puzzles, Maze 2
  // 7+:                 Second Word Search, Cryptogram
  // 8+:                 Crossword, Logic Grid, Sudoku
  // (Sudoku needs full number logic — appropriate from age 8)

  const showWordSearch    = maxAge >= 6 && (wordSearch?.placedWords.length ?? 0) > 0
  const showWordSearch2   = maxAge >= 7 && (wordSearch2?.placedWords.length ?? 0) > 0
  const showCrossword     = maxAge >= 8 && (crossword?.placedWords.length ?? 0) > 0
  const showSudoku        = maxAge >= 8
  const showCryptogram    = maxAge >= 7 && !!content.cryptogramPhrase
  const showRebus         = maxAge >= 6 && (content.rebusPuzzles?.length ?? 0) > 0
  const showLogicGrid     = maxAge >= 8 && !!content.logicGrid
  const showTravelTrivia  = maxAge >= 6 && (content.travelTrivia?.length ?? 0) > 0
  const showTravelMenu    = (content.travelMenu?.length ?? 0) > 0           // all ages
  const showTopFive       = (content.topFiveLists?.length ?? 0) > 0         // all ages
  const showComicStrip    = !!content.comicStrip                             // all ages
  const showMapDrawing    = !!content.mapDrawingChallenge                    // all ages
  const showTimeCapsule   = maxAge >= 5 && !!content.timeCapsuleLetter
  const showMaze2         = maxAge >= 6
  const showSillyChallenges = Array.isArray(content.sillyChallenges) && content.sillyChallenges.length > 0

  // Sudoku difficulty by age: 8–9 → easy, 10–11 → medium, 12+ → hard
  const sudokuDifficulty: SudokuDifficulty = maxAge <= 9 ? 'easy' : maxAge >= 12 ? 'hard' : 'medium'
  // Only generate sudoku if we'll show it
  const sudoku = showSudoku ? generateSudoku(seed, sudokuDifficulty) : null

  // Build page number sequence — only include pages that will render
  let p = 1
  const pn: Record<string, number> = {}
  const sectionPn: { activity: number; coloring: number; journal: number }[] = []

  pn.cover = p++
  pn.oath = p++
  if (hasMap) pn.map = p++
  pn.checklist = p++
  for (let i = 0; i < sections.length; i++) {
    sectionPn.push({ activity: p++, coloring: p++, journal: p++ })
  }
  pn.scavengerHunt = p++
  pn.bingo = p++
  if (showCrossword) pn.crossword = p++
  if (showWordSearch) pn.wordSearch = p++
  if (showWordSearch2) pn.wordSearch2 = p++
  if (showSudoku) pn.sudoku = p++
  if (showCryptogram) pn.cryptogram = p++
  if (showRebus) pn.rebus = p++
  if (showLogicGrid) pn.logicGrid = p++
  if (showTravelTrivia) pn.travelTrivia = p++
  if (showTravelMenu) pn.travelMenu = p++
  if (showTopFive) pn.topFive = p++
  if (showComicStrip) pn.comicStrip = p++
  pn.connectDots = p++
  pn.maze1 = p++
  if (showMaze2) pn.maze2 = p++
  if (showMapDrawing) pn.mapDrawing = p++
  if (showTimeCapsule) pn.timeCapsule = p++
  if (showSillyChallenges) pn.sillyChallenges = p++
  pn.badges = p++
  childPersonalization.forEach((_, i) => { pn[`cert_${i}`] = p++ })
  pn.answerKey = p++

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
      <OathPage pageNumber={pn.oath} />

      {/* Map (only when itinerary was provided) */}
      {hasMap && (
        <MapPage
          destinationDisplayName={destinationDisplayName}
          places={places!}
          mapImageB64={mapImageB64!}
          destinationIntro={content.destinationIntro}
          pageNumber={pn.map}
        />
      )}

      {/* Checklist */}
      <ChecklistPage
        destinationDisplayName={destinationDisplayName}
        sections={sections}
        badgeNames={badgeNames}
        pageNumber={pn.checklist}
      />

      {/* Sections: activity + coloring + journal page triples */}
      {sections.flatMap((section, i) => {
        const childIdx = i % childPersonalization.length
        const child = childPersonalization[childIdx]
        const imageUrl = sectionImageUrls?.[i] ?? null
        const sp = sectionPn[i]
        return [
          <SectionActivityPage
            key={`activity-${section.id}`}
            section={section}
            childPersonalization={child}
            pageNumber={sp.activity}
          />,
          <SectionColoringPage
            key={`coloring-${section.id}`}
            section={section}
            imageUrl={imageUrl}
            pageNumber={sp.coloring}
          />,
          <SectionJournalPage
            key={`journal-${section.id}`}
            sectionTitle={section.title}
            childAge={child.age}
            pageNumber={sp.journal}
          />,
        ]
      })}

      {/* Scavenger Hunt */}
      <ScavengerHuntPage
        items={scavengerHuntItems}
        destinationDisplayName={destinationDisplayName}
        pageNumber={pn.scavengerHunt}
      />

      {/* Bingo */}
      <BingoPage
        gridItems={bingoGrid}
        destinationDisplayName={destinationDisplayName}
        pageNumber={pn.bingo}
      />

      {/* Crossword — age 8+ */}
      {showCrossword && crossword && (
        <CrosswordPage
          crossword={crossword}
          pageNumber={pn.crossword}
        />
      )}

      {/* Word Search — age 6+ */}
      {showWordSearch && wordSearch && (
        <WordSearchPage
          wordSearch={wordSearch}
          destinationDisplayName={destinationDisplayName}
          pageNumber={pn.wordSearch}
        />
      )}

      {/* Word Search 2 — age 7+ */}
      {showWordSearch2 && wordSearch2 && (
        <WordSearchPage
          wordSearch={wordSearch2}
          destinationDisplayName={destinationDisplayName}
          pageNumber={pn.wordSearch2}
        />
      )}

      {/* Sudoku — age 8+ */}
      {showSudoku && sudoku && (
        <SudokuPage puzzle={sudoku.puzzle} difficulty={sudokuDifficulty} pageNumber={pn.sudoku} />
      )}

      {/* Cryptogram — age 7+ */}
      {showCryptogram && (
        <CryptogramPage phrase={content.cryptogramPhrase!} pageNumber={pn.cryptogram} />
      )}

      {/* Rebus Puzzles — age 6+ */}
      {showRebus && (
        <RebusPuzzlePage puzzles={content.rebusPuzzles!} destinationDisplayName={destinationDisplayName} pageNumber={pn.rebus} />
      )}

      {/* Logic Grid — age 8+ */}
      {showLogicGrid && (
        <LogicGridPage logicGrid={content.logicGrid!} pageNumber={pn.logicGrid} />
      )}

      {/* Travel Trivia — age 6+ */}
      {showTravelTrivia && (
        <TravelTriviaPage trivia={content.travelTrivia!} destinationDisplayName={destinationDisplayName} pageNumber={pn.travelTrivia} />
      )}

      {/* Travel Menu — all ages */}
      {showTravelMenu && (
        <TravelMenuPage menu={content.travelMenu!} destinationDisplayName={destinationDisplayName} pageNumber={pn.travelMenu} />
      )}

      {/* Top 5 Lists — all ages */}
      {showTopFive && (
        <TopFivePage topFiveLists={content.topFiveLists!} destinationDisplayName={destinationDisplayName} pageNumber={pn.topFive} />
      )}

      {/* Comic Strip — all ages */}
      {showComicStrip && (
        <ComicStripPage comicStrip={content.comicStrip!} pageNumber={pn.comicStrip} />
      )}

      {/* Connect the Dots — all ages */}
      <ConnectDotsPage
        destinationDisplayName={destinationDisplayName}
        pageNumber={pn.connectDots}
      />

      {/* Maze 1 — all ages */}
      <MazePage
        seed={seed}
        mazeIndex={1}
        pageNumber={pn.maze1}
      />

      {/* Maze 2 — age 6+ */}
      {showMaze2 && (
        <MazePage
          seed={seed}
          mazeIndex={2}
          pageNumber={pn.maze2}
        />
      )}

      {/* Map Drawing Challenge — all ages */}
      {showMapDrawing && (
        <MapDrawingPage
          mapDrawingChallenge={content.mapDrawingChallenge!}
          destinationDisplayName={destinationDisplayName}
          pageNumber={pn.mapDrawing}
        />
      )}

      {/* Time Capsule Letter — age 5+ */}
      {showTimeCapsule && (
        <TimeCapsulePage timeCapsuleLetter={content.timeCapsuleLetter!} pageNumber={pn.timeCapsule} />
      )}

      {/* Silly Challenges — all ages */}
      {showSillyChallenges && (
        <SillyChallengesPage
          challenges={content.sillyChallenges!}
          destinationDisplayName={destinationDisplayName}
          pageNumber={pn.sillyChallenges}
        />
      )}

      {/* Badges */}
      <BadgesPage
        sections={sections}
        badgeNames={badgeNames}
        pageNumber={pn.badges}
      />

      {/* Certificates — one per child */}
      {childPersonalization.map((child, i) => (
        <CertificatePage
          key={`cert-${child.name}`}
          child={child}
          destinationDisplayName={destinationDisplayName}
          pageNumber={pn[`cert_${i}`]}
        />
      ))}

      {/* Answer Key */}
      <AnswerKeyPage
        sections={sections}
        pageNumber={pn.answerKey}
      />
    </Document>
  )
}
