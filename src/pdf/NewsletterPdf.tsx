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

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 32,
    backgroundColor: COLORS.background,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.4,
  },
  container: {
    width: '100%',
    backgroundColor: '#feffff',
    borderRadius: 6,
    overflow: 'hidden',
  },
  hero: { width: '100%' },
  heroImage: { width: '100%', height: 180, objectFit: 'cover' },
  heroCredit: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10, fontSize: 9, color: '#6b7280' },
  body: { paddingHorizontal: 18, paddingVertical: 16 },
  byline: {
    fontSize: 10,
    color: COLORS.darkBlue,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  section: { paddingVertical: 14 },
  sectionBlue: { backgroundColor: COLORS.lightBlue, paddingHorizontal: 12, borderRadius: 6 },
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
  footer: { marginTop: 18, paddingTop: 14, borderTop: '1px solid #e5e7eb' },
  footerTitle: { fontSize: 11, fontWeight: 700, color: COLORS.darkBlue, marginBottom: 6 },
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
  return (
    <Document title={title || 'Nyhetsbrev'}>
      <Page size="A4" style={styles.page}>
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
              <Text style={styles.footerTitle}>{data.footerWebsiteLabel || 'Prosjekt'}</Text>
              <Text style={styles.paragraph}>{data.footerWebsite || ''}</Text>
              {data.footerWebsiteUrl ? (
                <Text>
                  <PdfLink href={data.footerWebsiteUrl}>{data.footerWebsiteTitle || data.footerWebsiteUrl}</PdfLink>
                </Text>
              ) : null}

              <View style={styles.spacer} />

              <Text style={styles.footerTitle}>{data.footerContactTitle || 'Kontakt'}</Text>
              {(data.footerContacts || []).map((c) => (
                <Text key={c.id} style={styles.paragraph}>
                  {c.name}, {c.role} {' — '}
                  <PdfLink href={`mailto:${c.email}`}>{c.email}</PdfLink>
                </Text>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

