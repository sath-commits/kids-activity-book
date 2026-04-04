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
  const maxAge = childPersonalization.length > 0
    ? Math.max(...childPersonalization.map(c => c.age))
    : 8

  const showWordSearch    = maxAge >= 6 && (wordSearch?.placedWords.length ?? 0) > 0
  const showWordSearch2   = maxAge >= 7 && (wordSearch2?.placedWords.length ?? 0) > 0
  const showCrossword     = maxAge >= 8 && (crossword?.placedWords.length ?? 0) > 0
  const showSudoku        = maxAge >= 8
  const showCryptogram    = maxAge >= 7 && !!content.cryptogramPhrase
  const showRebus         = maxAge >= 6 && (content.rebusPuzzles?.length ?? 0) > 0
  const showLogicGrid     = maxAge >= 8 && !!content.logicGrid
  const showTravelTrivia  = maxAge >= 6 && (content.travelTrivia?.length ?? 0) > 0
  const showTravelMenu    = (content.travelMenu?.length ?? 0) > 0
  const showTopFive       = (content.topFiveLists?.length ?? 0) > 0
  const showComicStrip    = !!content.comicStrip
  const showMapDrawing    = !!content.mapDrawingChallenge
  const showTimeCapsule   = maxAge >= 5 && !!content.timeCapsuleLetter
  const showMaze2         = maxAge >= 6
  const showSillyChallenges = Array.isArray(content.sillyChallenges) && content.sillyChallenges.length > 0

  // Sudoku difficulty by age: 8–9 → easy, 10–11 → medium, 12+ → hard
  const sudokuDifficulty: SudokuDifficulty = maxAge <= 9 ? 'easy' : maxAge >= 12 ? 'hard' : 'medium'
  const sudoku = showSudoku ? generateSudoku(seed, sudokuDifficulty) : null

  // ── Bonus page slots ──────────────────────────────────────────────────────
  // Build an ordered list of bonus page keys (only pages that will render).
  // These are distributed evenly between sections to break monotony.
  const bonusSlots: string[] = [
    'scavengerHunt',
    'bingo',
    ...(showTravelTrivia  ? ['travelTrivia']    : []),
    ...(showCrossword     ? ['crossword']        : []),
    ...(showWordSearch    ? ['wordSearch']       : []),
    ...(showRebus         ? ['rebus']            : []),
    'connectDots',
    ...(showTravelMenu    ? ['travelMenu']       : []),
    ...(showComicStrip    ? ['comicStrip']       : []),
    ...(showWordSearch2   ? ['wordSearch2']      : []),
    'maze1',
    ...(showSudoku        ? ['sudoku']           : []),
    ...(showCryptogram    ? ['cryptogram']       : []),
    ...(showTopFive       ? ['topFive']          : []),
    ...(showLogicGrid     ? ['logicGrid']        : []),
    ...(showMaze2         ? ['maze2']            : []),
    ...(showMapDrawing    ? ['mapDrawing']       : []),
    ...(showTimeCapsule   ? ['timeCapsule']      : []),
    ...(showSillyChallenges ? ['sillyChallenges'] : []),
  ]

  // Distribute bonus pages as evenly as possible after each section.
  // Earlier sections get the extra page when total doesn't divide evenly.
  const sectionCount = sections.length
  const base = Math.floor(bonusSlots.length / sectionCount)
  const extra = bonusSlots.length % sectionCount
  const bonusAfter: number[] = sections.map((_, i) => base + (i < extra ? 1 : 0))

  // ── Page number assignment (must follow render order) ─────────────────────
  let p = 1
  const pn: Record<string, number> = {}
  const sectionPn: { activity: number; coloring: number; journal: number }[] = []

  pn.cover = p++
  pn.oath = p++
  if (hasMap) pn.map = p++
  pn.checklist = p++

  let bonusAssignIdx = 0
  for (let i = 0; i < sectionCount; i++) {
    sectionPn.push({ activity: p++, coloring: p++, journal: p++ })
    for (let b = 0; b < bonusAfter[i]; b++) {
      pn[bonusSlots[bonusAssignIdx++]] = p++
    }
  }

  pn.badges = p++
  childPersonalization.forEach((_, i) => { pn[`cert_${i}`] = p++ })
  pn.answerKey = p++

  // ── Bonus page renderer ───────────────────────────────────────────────────
  function renderBonusPage(key: string) {
    switch (key) {
      case 'scavengerHunt':
        return <ScavengerHuntPage key="scavengerHunt" items={scavengerHuntItems} destinationDisplayName={destinationDisplayName} pageNumber={pn.scavengerHunt} />
      case 'bingo':
        return <BingoPage key="bingo" gridItems={bingoGrid} destinationDisplayName={destinationDisplayName} pageNumber={pn.bingo} />
      case 'crossword':
        return crossword ? <CrosswordPage key="crossword" crossword={crossword} pageNumber={pn.crossword} /> : null
      case 'wordSearch':
        return wordSearch ? <WordSearchPage key="wordSearch" wordSearch={wordSearch} destinationDisplayName={destinationDisplayName} pageNumber={pn.wordSearch} /> : null
      case 'wordSearch2':
        return wordSearch2 ? <WordSearchPage key="wordSearch2" wordSearch={wordSearch2} destinationDisplayName={destinationDisplayName} pageNumber={pn.wordSearch2} /> : null
      case 'sudoku':
        return sudoku ? <SudokuPage key="sudoku" puzzle={sudoku.puzzle} difficulty={sudokuDifficulty} pageNumber={pn.sudoku} /> : null
      case 'cryptogram':
        return <CryptogramPage key="cryptogram" phrase={content.cryptogramPhrase!} pageNumber={pn.cryptogram} />
      case 'rebus':
        return <RebusPuzzlePage key="rebus" puzzles={content.rebusPuzzles!} destinationDisplayName={destinationDisplayName} pageNumber={pn.rebus} />
      case 'logicGrid':
        return <LogicGridPage key="logicGrid" logicGrid={content.logicGrid!} pageNumber={pn.logicGrid} />
      case 'travelTrivia':
        return <TravelTriviaPage key="travelTrivia" trivia={content.travelTrivia!} destinationDisplayName={destinationDisplayName} pageNumber={pn.travelTrivia} />
      case 'travelMenu':
        return <TravelMenuPage key="travelMenu" menu={content.travelMenu!} destinationDisplayName={destinationDisplayName} pageNumber={pn.travelMenu} />
      case 'topFive':
        return <TopFivePage key="topFive" topFiveLists={content.topFiveLists!} destinationDisplayName={destinationDisplayName} pageNumber={pn.topFive} />
      case 'comicStrip':
        return <ComicStripPage key="comicStrip" comicStrip={content.comicStrip!} pageNumber={pn.comicStrip} />
      case 'connectDots':
        return <ConnectDotsPage key="connectDots" destinationDisplayName={destinationDisplayName} pageNumber={pn.connectDots} />
      case 'maze1':
        return <MazePage key="maze1" seed={seed} mazeIndex={1} pageNumber={pn.maze1} />
      case 'maze2':
        return <MazePage key="maze2" seed={seed} mazeIndex={2} pageNumber={pn.maze2} />
      case 'mapDrawing':
        return <MapDrawingPage key="mapDrawing" mapDrawingChallenge={content.mapDrawingChallenge!} destinationDisplayName={destinationDisplayName} pageNumber={pn.mapDrawing} />
      case 'timeCapsule':
        return <TimeCapsulePage key="timeCapsule" timeCapsuleLetter={content.timeCapsuleLetter!} pageNumber={pn.timeCapsule} />
      case 'sillyChallenges':
        return <SillyChallengesPage key="sillyChallenges" challenges={content.sillyChallenges!} destinationDisplayName={destinationDisplayName} pageNumber={pn.sillyChallenges} />
      default:
        return null
    }
  }

  return (
    <Document
      title={`${destinationDisplayName} Junior Explorer Adventure`}
      author="Little Explorer · builtthisweekend.com"
    >
      {/* ── Front matter ── */}
      <CoverPage
        destinationDisplayName={destinationDisplayName}
        explorers={childPersonalization}
        tripDates={tripDates}
        coverImageUrl={coverImageUrl}
      />
      <OathPage pageNumber={pn.oath} />
      {hasMap && (
        <MapPage
          destinationDisplayName={destinationDisplayName}
          places={places!}
          mapImageB64={mapImageB64!}
          destinationIntro={content.destinationIntro}
          pageNumber={pn.map}
        />
      )}
      <ChecklistPage
        destinationDisplayName={destinationDisplayName}
        sections={sections}
        badgeNames={badgeNames}
        pageNumber={pn.checklist}
      />

      {/* ── Interleaved sections + bonus pages ── */}
      {sections.flatMap((section, i) => {
        const child = childPersonalization[i % childPersonalization.length]
        const imageUrl = sectionImageUrls?.[i] ?? null
        const sp = sectionPn[i]

        // Compute which bonus slots follow this section
        const slotStart = bonusAfter.slice(0, i).reduce((a, b) => a + b, 0)
        const slotKeys = bonusSlots.slice(slotStart, slotStart + bonusAfter[i])

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
          ...slotKeys.map(key => renderBonusPage(key)),
        ].filter(Boolean)
      })}

      {/* ── Back matter ── */}
      <BadgesPage
        sections={sections}
        badgeNames={badgeNames}
        pageNumber={pn.badges}
      />
      {childPersonalization.map((child, i) => (
        <CertificatePage
          key={`cert-${child.name}`}
          child={child}
          destinationDisplayName={destinationDisplayName}
          pageNumber={pn[`cert_${i}`]}
        />
      ))}
      <AnswerKeyPage
        sections={sections}
        pageNumber={pn.answerKey}
      />
    </Document>
  )
}
