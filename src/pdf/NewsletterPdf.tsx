import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
} from '@react-pdf/renderer';
import type { GridItem, ListItem, NewsletterData, Section } from '../types';
import { COLORS } from '../constants';

type Props = {
  data: NewsletterData;
  title?: string;
};

function estimateSinglePageHeightPt(data: NewsletterData): number {
  // Rough heuristic: good enough to avoid huge trailing whitespace.
  // A4 width is ~595pt; we size height based on amount of text + section types.
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  let h = 320; // header + top spacing

  if (data.byline && data.byline.trim()) h += 28;

  for (const s of data.sections || []) {
    h += 40; // section padding/title

    const content = (s.content || '').trim();
    if (content) {
      // approximate lines: 95 chars/line at this font size/layout
      const lines = Math.ceil(content.length / 95);
      h += lines * 14;
    }

    if (s.type === 'image-text') h += 180;
    if (s.type === 'full-image') h += 260;

    if (s.type === 'list') {
      const count = (s.items || []).length;
      // each member block (image + text)
      h += count * 120;
    }

    if (s.type === 'grid') {
      const count = (s.gridItems || []).length;
      const rows = Math.ceil(count / 2);
      h += rows * 210;
    }
  }

  // footer (dark section + optional logos)
  h += 220;
  if (data.footerLogoFull) h += 90;

  // Safety margin to avoid accidental pagination after small styling tweaks.
  // Tuned to minimize trailing whitespace while still staying on a single page.
  return clamp(Math.round(h), 1400, 20000);
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 22,
    backgroundColor: COLORS.background,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.4,
  },
  container: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  hero: { width: '100%' },
  // Let the image define its own height to avoid cropping/letterboxing issues.
  heroImage: { width: '100%', objectFit: 'contain' },
  heroCredit: { paddingHorizontal: 24, paddingTop: 6, paddingBottom: 8, fontSize: 9, color: '#6b7280' },
  body: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  byline: {
    fontSize: 10,
    color: COLORS.darkBlue,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  section: { paddingVertical: 14 },
  sectionBlue: { backgroundColor: COLORS.lightBlue, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 0 },
  headingBig: { fontSize: 18, fontWeight: 700, color: COLORS.darkBlue, marginBottom: 8 },
  heading: { fontSize: 14, fontWeight: 400, color: COLORS.darkBlue, marginBottom: 8 },
  paragraph: { fontSize: 11, marginBottom: 8 },
  link: { color: COLORS.darkBlue, textDecoration: 'underline' },
  imageFull: { width: '100%', height: 220, objectFit: 'cover', borderRadius: 4, marginBottom: 6 },
  imageInline: { width: 220, height: 150, objectFit: 'cover', borderRadius: 4 },
  imageCredit: { fontSize: 9, color: '#6b7280', marginTop: 3 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flexGrow: 1, flexBasis: 0 },
  spacer: { height: 10 },
  listItem: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  avatar: { width: 54, height: 54, borderRadius: 4, objectFit: 'cover' },
  memberName: { fontSize: 12, fontWeight: 700, color: COLORS.darkBlue },
  small: { fontSize: 9, color: '#6b7280' },
  gridRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  gridCard: { flexGrow: 1, flexBasis: 0, padding: 10, borderRadius: 6, backgroundColor: '#ffffff' },
  gridImage: { width: '100%', height: 120, objectFit: 'cover', borderRadius: 4, marginBottom: 6 },
  footer: { marginTop: 18, padding: 20, backgroundColor: COLORS.darkBlue },
  footerLabel: { fontSize: 11, color: '#70E9FF', marginBottom: 6 },
  footerText: { fontSize: 11, color: '#ffffff', marginBottom: 6 },
  footerLink: { color: '#ffffff', textDecoration: 'underline' },
  footerRow: { flexDirection: 'row', gap: 16 },
  footerCol: { flexGrow: 1, flexBasis: 0 },
  footerDivider: { marginTop: 14, paddingTop: 14, borderTop: '1px solid #354E7E' },
  footerLogo: { width: '100%', height: 60, objectFit: 'contain' },
});

function isHttpUrl(url: string | undefined): url is string {
  if (!url) return false;
  const t = url.trim();
  if (t.startsWith('data:')) return false;
  return t.startsWith('https://') || t.startsWith('http://');
}

function splitParagraphs(text: string | undefined): string[] {
  if (!text) return [];
  return text.split(/\r?\n/).flatMap(line => (line.trim() ? [line] : [''])).filter(() => true);
}

function PdfLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <Link src={href} style={styles.link}>
      {children}
    </Link>
  );
}

function renderSectionTitle(section: Section, index: number) {
  const isFirst = index === 0;
  return (
    <Text style={isFirst ? styles.headingBig : styles.heading}>
      {section.title || ''}
    </Text>
  );
}

function renderTextBlock(text: string | undefined) {
  const lines = splitParagraphs(text);
  if (lines.length === 0) return null;

  return (
    <View>
      {lines.map((line, i) => (
        <Text key={i} style={styles.paragraph}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function renderListItem(member: ListItem) {
  return (
    <View key={member.id} style={styles.listItem}>
      {isHttpUrl(member.image) ? <Image style={styles.avatar} src={member.image} /> : <View style={styles.avatar} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.memberName}>{member.name || ''}</Text>
        {renderTextBlock(member.bio)}
        {member.linkUrl ? (
          <Text>
            <PdfLink href={member.linkUrl}>{member.linkText || 'Les mer'}</PdfLink>
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function renderGridCard(item: GridItem) {
  return (
    <View key={item.id} style={styles.gridCard}>
      {isHttpUrl(item.image) ? <Image style={styles.gridImage} src={item.image} /> : null}
      {item.imageCredit ? <Text style={styles.imageCredit}>Foto: {item.imageCredit}</Text> : null}
      <Text style={styles.memberName}>{item.title || ''}</Text>
      {renderTextBlock(item.content)}
      {item.linkUrl ? (
        <Text>
          <PdfLink href={item.linkUrl}>{item.linkText || 'Les mer'}</PdfLink>
        </Text>
      ) : null}
    </View>
  );
}

function renderSection(section: Section, index: number) {
  const wrapperStyle = [
    styles.section,
    section.backgroundColor === 'blue' ? styles.sectionBlue : null,
  ].filter(Boolean) as any;

  if (section.type === 'text') {
    return (
      <View key={section.id} style={wrapperStyle}>
        {renderSectionTitle(section, index)}
        {renderTextBlock(section.content)}
        {section.linkUrl ? (
          <Text>
            <PdfLink href={section.linkUrl}>{section.linkText || 'Les mer'}</PdfLink>
          </Text>
        ) : null}
      </View>
    );
  }

  if (section.type === 'full-image') {
    return (
      <View key={section.id} style={wrapperStyle}>
        {isHttpUrl(section.image) ? <Image style={styles.imageFull} src={section.image} /> : null}
        {section.imageCredit ? <Text style={styles.imageCredit}>Foto: {section.imageCredit}</Text> : null}
        {section.linkUrl ? (
          <Text>
            <PdfLink href={section.linkUrl}>{section.linkText || 'Les mer'}</PdfLink>
          </Text>
        ) : null}
      </View>
    );
  }

  if (section.type === 'image-text') {
    const imageFirst = section.imagePosition === 'left';
    const imageNode = isHttpUrl(section.image) ? (
      <View>
        <Image style={styles.imageInline} src={section.image} />
        {section.imageCredit ? <Text style={styles.imageCredit}>Foto: {section.imageCredit}</Text> : null}
      </View>
    ) : null;

    const textNode = (
      <View style={styles.col}>
        {renderSectionTitle(section, index)}
        {renderTextBlock(section.content)}
        {section.linkUrl ? (
          <Text>
            <PdfLink href={section.linkUrl}>{section.linkText || 'Les mer'}</PdfLink>
          </Text>
        ) : null}
      </View>
    );

    return (
      <View key={section.id} style={wrapperStyle}>
        <View style={styles.row}>
          {imageFirst ? imageNode : null}
          {textNode}
          {!imageFirst ? imageNode : null}
        </View>
      </View>
    );
  }

  if (section.type === 'list') {
    const members = section.items || [];
    return (
      <View key={section.id} style={wrapperStyle}>
        {renderSectionTitle(section, index)}
        <View>
          {members.map(renderListItem)}
        </View>
      </View>
    );
  }

  if (section.type === 'grid') {
    const items = section.gridItems || [];
    const rows = Array.from({ length: Math.ceil(items.length / 2) }).map((_, rowIndex) => [
      items[rowIndex * 2],
      items[rowIndex * 2 + 1],
    ]);

    return (
      <View key={section.id} style={wrapperStyle}>
        {renderSectionTitle(section, index)}
        {rows.map((row, i) => (
          <View key={i} style={styles.gridRow}>
            {row[0] ? renderGridCard(row[0]) : <View style={styles.gridCard} />}
            {row[1] ? renderGridCard(row[1]) : <View style={styles.gridCard} />}
          </View>
        ))}
      </View>
    );
  }

  return null;
}

export function NewsletterPdfDocument({ data, title }: Props) {
  // A4 width in points is ~595.28. Use a single "roll" page with an estimated height to
  // avoid pagination while also avoiding huge trailing whitespace.
  const singlePageSize: [number, number] = [595.28, estimateSinglePageHeightPt(data)];

  return (
    <Document title={title || 'Nyhetsbrev'}>
      <Page size={singlePageSize} style={styles.page}>
        <View style={styles.container}>
          {isHttpUrl(data.heroImage) ? (
            <View style={styles.hero}>
              <Image style={styles.heroImage} src={data.heroImage} />
              {data.heroImageCredit ? (
                <Text style={styles.heroCredit}>Foto: {data.heroImageCredit}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.body}>
            {data.byline ? <Text style={styles.byline}>{data.byline}</Text> : null}

            {data.sections.map((section, index) => (
              <View key={section.id}>
                {renderSection(section, index)}
              </View>
            ))}

            <View style={styles.footer}>
              <View style={styles.footerRow}>
                <View style={styles.footerCol}>
                  <Text style={styles.footerLabel}>{data.footerWebsiteLabel || 'Nettside'}</Text>
                  <Text style={styles.footerText}>{data.footerWebsite || ''}</Text>
                  {data.footerWebsiteUrl ? (
                    <Link src={data.footerWebsiteUrl} style={styles.footerLink}>
                      {data.footerWebsiteTitle || data.footerWebsiteUrl}
                    </Link>
                  ) : null}
                </View>
                <View style={styles.footerCol}>
                  <Text style={styles.footerLabel}>{data.footerContactTitle || 'Har du spørsmål til oss?'}</Text>
                  {(data.footerContacts || []).map((c) => (
                    <Text key={c.id} style={styles.footerText}>
                      {c.name}, {c.role} {' — '}
                      <Link src={`mailto:${c.email}`} style={styles.footerLink}>
                        {c.email}
                      </Link>
                    </Text>
                  ))}
                </View>
              </View>

              {isHttpUrl(data.footerLogoFull) ? (
                <View style={styles.footerDivider}>
                  <Image style={styles.footerLogo} src={data.footerLogoFull} />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

