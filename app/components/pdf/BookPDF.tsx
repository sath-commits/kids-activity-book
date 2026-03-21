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

// Register fonts
Font.register({
  family: 'Nunito',
  src: '/fonts/Nunito-Regular.ttf',
})

Font.register({
  family: 'Nunito-Bold',
  src: '/fonts/Nunito-Bold.ttf',
})

interface BookPDFProps {
  book: GeneratedBook
}

export default function BookPDF({ book }: BookPDFProps) {
  const { content, coverImageB64, sectionImagesB64, childPersonalization, destinationDisplayName, tripDates } = book
  const { sections, scavengerHuntItems, bingoGrid, badgeNames } = content

  let pageNum = 1

  return (
    <Document
      title={`${destinationDisplayName} Junior Explorer Adventure`}
      author="Little Explorer · builtthisweekend.com"
    >
      {/* Cover */}
      <CoverPage
        destinationDisplayName={destinationDisplayName}
        children={childPersonalization}
        tripDates={tripDates}
        coverImageB64={coverImageB64}
      />

      {/* Oath */}
      <OathPage />

      {/* Checklist */}
      <ChecklistPage
        destinationDisplayName={destinationDisplayName}
        sections={sections}
        badgeNames={badgeNames}
        pageNumber={3}
      />

      {/* Sections: activity + coloring page pairs */}
      {sections.map((section, i) => {
        const childIdx = i % childPersonalization.length
        const child = childPersonalization[childIdx]
        const imageB64 = sectionImagesB64?.[i] ?? null
        const activityPageNum = 4 + i * 2
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
        pageNumber={4 + sections.length * 2}
      />

      {/* Bingo */}
      <BingoPage
        gridItems={bingoGrid}
        destinationDisplayName={destinationDisplayName}
        pageNumber={5 + sections.length * 2}
      />

      {/* Badges */}
      <BadgesPage
        sections={sections}
        badgeNames={badgeNames}
        pageNumber={6 + sections.length * 2}
      />

      {/* Certificates — one per child */}
      {childPersonalization.map((child, i) => (
        <CertificatePage
          key={`cert-${child.name}`}
          child={child}
          destinationDisplayName={destinationDisplayName}
          pageNumber={7 + sections.length * 2 + i}
        />
      ))}

      {/* Answer Key */}
      <AnswerKeyPage
        sections={sections}
        pageNumber={7 + sections.length * 2 + childPersonalization.length}
      />
    </Document>
  )
}
