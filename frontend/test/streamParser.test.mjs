import assert from 'node:assert';

const SECTION_TAGS = {
  summary: '<<<SECTION_SUMMARY>>>',
  features: '<<<SECTION_FEATURES>>>',
  tech: '<<<SECTION_TECH>>>',
  design: '<<<SECTION_DESIGN>>>',
  prompts: '<<<SECTION_PROMPTS>>>',
  done: '<<<SECTION_DONE>>>',
};

const HEADING_PATTERNS = {
  summary: /(?:<<<SECTION_SUMMARY>>>|#\s*Executive Summary\b)/i,
  features: /(?:<<<SECTION_FEATURES>>>|#\s*Core Features\b)/i,
  tech: /(?:<<<SECTION_TECH>>>|#\s*Technical Architecture\b)/i,
  design: /(?:<<<SECTION_DESIGN>>>|#\s*UI\/UX Direction\b)/i,
  prompts: /(?:<<<SECTION_PROMPTS>>>|#\s*Ready-to-Use\b)/i,
};

function parseStreamToSections(fullBuffer) {
  const sections = {
    summary: '',
    features: '',
    tech: '',
    design: '',
    prompts: '',
  };

  if (!fullBuffer) return sections;

  const keys = ['summary', 'features', 'tech', 'design', 'prompts'];
  const startIndices = [];

  for (const key of keys) {
    const strictTag = SECTION_TAGS[key];
    const strictPos = fullBuffer.indexOf(strictTag);
    if (strictPos !== -1) {
      startIndices.push({ key, index: strictPos, matchLength: strictTag.length });
      continue;
    }

    const match = HEADING_PATTERNS[key].exec(fullBuffer);
    if (match && match.index !== -1) {
      startIndices.push({ key, index: match.index, matchLength: 0 });
    }
  }

  if (startIndices.length === 0) {
    sections.summary = fullBuffer;
    return sections;
  }

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
    text = text.replace(/<<<SECTION_[A-Z_]+>>>/g, '').trim();
    sections[current.key] = text;
  }

  return sections;
}

// Test 1: Standard tags
const sampleStandard = `
<<<SECTION_SUMMARY>>>
# Summary Content
<<<SECTION_FEATURES>>>
- Feature A
<<<SECTION_TECH>>>
- Go and React
<<<SECTION_DESIGN>>>
# Palette #4F46E5
<<<SECTION_PROMPTS>>>
v0 prompt
<<<SECTION_DONE>>>
`;

const res1 = parseStreamToSections(sampleStandard);
assert.strictEqual(res1.summary, '# Summary Content');
assert.strictEqual(res1.features, '- Feature A');
assert.strictEqual(res1.tech, '- Go and React');
assert.strictEqual(res1.design, '# Palette #4F46E5');
assert.strictEqual(res1.prompts, 'v0 prompt');

// Test 2: Missing delimiter tags with heading fallback
const sampleHeadingsOnly = `
# Executive Summary
Problem details here
# Core Features
- User authentication
# Technical Architecture
Stack: Go + React
# UI/UX Direction
Theme: Dark Neobrutalism
# Ready-to-Use
Build this app prompt
`;

const res2 = parseStreamToSections(sampleHeadingsOnly);
assert.ok(res2.summary.includes('Problem details here'));
assert.ok(res2.features.includes('- User authentication'));
assert.ok(res2.tech.includes('Stack: Go + React'));
assert.ok(res2.design.includes('Theme: Dark Neobrutalism'));
assert.ok(res2.prompts.includes('Build this app prompt'));

console.log('StreamParser self-check with fallback passed!');
