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
import BadgesPage from './BadgesPage'
import CertificatePage from './CertificatePage'
import AnswerKeyPage from './AnswerKeyPage'
import MapPage from './MapPage'

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
  const { content, coverImageB64, sectionImagesB64, childPersonalization, destinationDisplayName, tripDates, places, mapImageB64 } = book
  const { sections, scavengerHuntItems, bingoGrid, badgeNames } = content

  const hasMap = !!mapImageB64 && Array.isArray(places) && places.length > 0
  const mapOffset = hasMap ? 1 : 0

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
        coverImageB64={coverImageB64}
      />

      {/* Oath */}
      <OathPage />

      {/* Map (only when itinerary was provided) */}
      {hasMap && (
        <MapPage
          destinationDisplayName={destinationDisplayName}
          places={places!}
          mapImageB64={mapImageB64!}
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

      {/* Sections: activity + coloring page pairs */}
      {sections.flatMap((section, i) => {
        const childIdx = i % childPersonalization.length
        const child = childPersonalization[childIdx]
        const imageB64 = sectionImagesB64?.[i] ?? null
        const activityPageNum = 4 + mapOffset + i * 2
        const coloringPageNum = activityPageNum + 1
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
            imageB64={imageB64}
            pageNumber={coloringPageNum}
          />,
        ]
      })}

      {/* Scavenger Hunt */}
      <ScavengerHuntPage
        items={scavengerHuntItems}
        destinationDisplayName={destinationDisplayName}
        pageNumber={4 + mapOffset + sections.length * 2}
      />

      {/* Bingo */}
      <BingoPage
        gridItems={bingoGrid}
        destinationDisplayName={destinationDisplayName}
        pageNumber={5 + mapOffset + sections.length * 2}
      />

      {/* Badges */}
      <BadgesPage
        sections={sections}
        badgeNames={badgeNames}
        pageNumber={6 + mapOffset + sections.length * 2}
      />

      {/* Certificates — one per child */}
      {childPersonalization.map((child, i) => (
        <CertificatePage
          key={`cert-${child.name}`}
          child={child}
          destinationDisplayName={destinationDisplayName}
          pageNumber={7 + mapOffset + sections.length * 2 + i}
        />
      ))}

      {/* Answer Key */}
      <AnswerKeyPage
        sections={sections}
        pageNumber={7 + mapOffset + sections.length * 2 + childPersonalization.length}
      />
    </Document>
  )
}
