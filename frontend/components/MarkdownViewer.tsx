import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MarkdownViewerProps {
  content: string;
  accentColor?: string;
}

/**
 * Parses markdown content and renders it as React Native components.
 * Supports: tables, bullet lists, numbered lists, bold, headers, checkboxes.
 */
export default function MarkdownViewer({ content, accentColor = '#7B2D8E' }: MarkdownViewerProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Check for markdown table
    if (line.includes('|') && line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      elements.push(renderTable(tableLines, key++, accentColor));
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <Text key={key++} style={styles.h3}>{line.substring(4)}</Text>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <Text key={key++} style={styles.h2}>{line.substring(3)}</Text>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <Text key={key++} style={styles.h1}>{line.substring(2)}</Text>
      );
      i++;
      continue;
    }

    // Checkbox items
    if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
      const checked = line.startsWith('- [x] ');
      const text = line.substring(6);
      elements.push(
        <View key={key++} style={styles.checkboxRow}>
          <View style={[styles.checkbox, checked && { backgroundColor: accentColor, borderColor: accentColor }]}>
            {checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.checkboxText, checked && styles.checkboxTextChecked]}>
            {renderInlineFormatting(text)}
          </Text>
        </View>
      );
      i++;
      continue;
    }

    // Bullet list items
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const text = line.substring(2);
      elements.push(
        <View key={key++} style={styles.bulletRow}>
          <View style={[styles.bullet, { backgroundColor: accentColor }]} />
          <Text style={styles.bulletText}>{renderInlineFormatting(text)}</Text>
        </View>
      );
      i++;
      continue;
    }

    // Numbered list items
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <View key={key++} style={styles.numberedRow}>
          <View style={[styles.numberBadge, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.numberText, { color: accentColor }]}>{numberedMatch[1]}</Text>
          </View>
          <Text style={styles.numberedText}>{renderInlineFormatting(numberedMatch[2])}</Text>
        </View>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <Text key={key++} style={styles.paragraph}>{renderInlineFormatting(line)}</Text>
    );
    i++;
  }

  return <View style={styles.container}>{elements}</View>;
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Handle bold text (**text** or __text__)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let partKey = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.substring(0, boldMatch.index));
      }
      parts.push(
        <Text key={`bold-${partKey++}`} style={{ fontWeight: '700' }}>
          {boldMatch[1]}
        </Text>
      );
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function renderTable(tableLines: string[], key: number, accentColor: string): React.ReactNode {
  // Parse table lines
  const rows: string[][] = [];
  let headerRow: string[] | null = null;

  for (let i = 0; i < tableLines.length; i++) {
    const line = tableLines[i];
    
    // Skip separator lines (|---|---|)
    if (line.match(/^\|[\s\-:]+\|/)) continue;

    const cells = line
      .split('|')
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1) // Remove empty first/last
      .map(cell => cell.trim());

    if (cells.length > 0) {
      if (!headerRow) {
        headerRow = cells;
      } else {
        rows.push(cells);
      }
    }
  }

  if (!headerRow || headerRow.length === 0) return null;

  return (
    <View key={key} style={styles.tableContainer}>
      {/* Header Row */}
      <View style={[styles.tableHeaderRow, { backgroundColor: accentColor }]}>
        {headerRow.map((cell, idx) => (
          <View key={idx} style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>
            <Text style={styles.tableHeaderText} numberOfLines={2}>{cell}</Text>
          </View>
        ))}
      </View>

      {/* Data Rows */}
      {rows.map((row, rowIdx) => (
        <View
          key={rowIdx}
          style={[
            styles.tableRow,
            rowIdx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
            rowIdx === rows.length - 1 && styles.tableRowLast,
          ]}
        >
          {headerRow!.map((_, cellIdx) => (
            <View key={cellIdx} style={[styles.tableCell, { flex: 1 }]}>
              <Text style={styles.tableCellText} numberOfLines={3}>
                {row[cellIdx] || '—'}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  paragraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 4,
  },
  h1: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
    marginBottom: 6,
  },
  h2: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 10,
    marginBottom: 4,
  },
  h3: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  // Bullet lists
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
    marginBottom: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  // Numbered lists
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  numberedText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
    marginBottom: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  checkboxTextChecked: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  // Tables
  tableContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e0d8',
  },
  tableHeaderRow: {
    flexDirection: 'row',
  },
  tableHeaderCell: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.15)',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#faf8f5',
  },
  tableRowLast: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#f0ede8',
  },
  tableCellText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
});
