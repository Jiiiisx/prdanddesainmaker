import type { PRDSections } from '../types';

const SECTION_TAGS = {
  summary: '<<<SECTION_SUMMARY>>>',
  features: '<<<SECTION_FEATURES>>>',
  tech: '<<<SECTION_TECH>>>',
  design: '<<<SECTION_DESIGN>>>',
  prompts: '<<<SECTION_PROMPTS>>>',
  done: '<<<SECTION_DONE>>>',
};

// Fallback regex patterns if the LLM omits or misspells delimiters
const HEADING_PATTERNS: Record<keyof PRDSections, RegExp> = {
  summary: /(?:<<<SECTION_SUMMARY>>>|#\s*Executive Summary\b)/i,
  features: /(?:<<<SECTION_FEATURES>>>|#\s*Core Features\b)/i,
  tech: /(?:<<<SECTION_TECH>>>|#\s*Technical Architecture\b)/i,
  design: /(?:<<<SECTION_DESIGN>>>|#\s*UI\/UX Direction\b)/i,
  prompts: /(?:<<<SECTION_PROMPTS>>>|#\s*Ready-to-Use\b)/i,
};

export function parseStreamToSections(fullBuffer: string): PRDSections {
  const sections: PRDSections = {
    summary: '',
    features: '',
    tech: '',
    design: '',
    prompts: '',
  };

  if (!fullBuffer) return sections;

  const keys: (keyof PRDSections)[] = ['summary', 'features', 'tech', 'design', 'prompts'];

  // Find start index of each section using strict tag or heading fallback
  const startIndices: { key: keyof PRDSections; index: number; matchLength: number }[] = [];

  for (const key of keys) {
    const strictTag = SECTION_TAGS[key];
    const strictPos = fullBuffer.indexOf(strictTag);
    if (strictPos !== -1) {
      startIndices.push({ key, index: strictPos, matchLength: strictTag.length });
      continue;
    }

    // Heading fallback
    const match = HEADING_PATTERNS[key].exec(fullBuffer);
    if (match && match.index !== -1) {
      startIndices.push({ key, index: match.index, matchLength: 0 }); // keep heading in markdown
    }
  }

  // If no sections detected, return buffer as initial summary draft
  if (startIndices.length === 0) {
    sections.summary = fullBuffer;
    return sections;
  }

  // Sort by appearance in text
  startIndices.sort((a, b) => a.index - b.index);

  const doneIndex = fullBuffer.indexOf(SECTION_TAGS.done);

  for (let i = 0; i < startIndices.length; i++) {
    const current = startIndices[i];
    const contentStart = current.index + current.matchLength;
    const nextStart = i + 1 < startIndices.length ? startIndices[i + 1].index : fullBuffer.length;
    let contentEnd = nextStart;

    if (doneIndex !== -1 && doneIndex >= contentStart && doneIndex < contentEnd) {
      contentEnd = doneIndex;
    }

    let text = fullBuffer.slice(contentStart, contentEnd).trim();
    // Clean any trailing delimiter artifacts
    text = text.replace(/<<<SECTION_[A-Z_]+>>>/g, '').trim();
    sections[current.key] = text;
  }

  return sections;
}

export function extractHexColors(text: string): { name: string; hex: string }[] {
  const linePattern = /-\s*([A-Za-z\s]+?):\s*(#(?:[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}))\b/g;
  const structuredResults: { name: string; hex: string }[] = [];
  const seenHexes = new Set<string>();

  let lineMatch: RegExpExecArray | null;
  while ((lineMatch = linePattern.exec(text)) !== null) {
    const name = lineMatch[1].trim();
    const hex = lineMatch[2].toUpperCase();
    if (!seenHexes.has(hex)) {
      seenHexes.add(hex);
      structuredResults.push({ name, hex });
    }
  }

  if (structuredResults.length >= 3) {
    return structuredResults.slice(0, 6);
  }

  const hexRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
  const rawMatches = Array.from(new Set(text.match(hexRegex) || []))
    .map((h) => h.toUpperCase())
    .filter((h) => h !== '#18181B' && h !== '#000' && h !== '#000000'); // filter UI borders

  const fallback = [
    { name: 'Primary Indigo', hex: '#4F46E5' },
    { name: 'Sky Accent', hex: '#0EA5E9' },
    { name: 'Canvas Base', hex: '#F8FAFC' },
    { name: 'Glass Surface', hex: '#FFFFFF' },
    { name: 'Slate Contrast', hex: '#0F172A' },
  ];

  if (rawMatches.length === 0) return fallback;

  return rawMatches.slice(0, 6).map((hex, idx) => ({
    name: `Token ${idx + 1}`,
    hex,
  }));
}
