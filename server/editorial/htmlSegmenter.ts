export function segmentSentencesFromHtml(html: string): string[] {
  const withLineBreaks = html
    .replace(/<\/?(p|li|h[1-6]|div|br|tr|td|th)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  const blocks = withLineBreaks.split('\n').map(b => b.trim()).filter(b => b.length > 0);
  const sentences: string[] = [];
  
  const abbr = ['dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr', 'u.s', 'u', 's', 'e', 'g', 'i', 'etc', 'vs', 'st', 'inc', 'ltd', 'co', 'approx'];

  blocks.forEach(block => {
    let currentSentence = "";
    const words = block.split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        currentSentence += (currentSentence.length ? " " : "") + word;
        
        if (/[.?!][)"']*$/.test(word)) {
            const wordLower = word.toLowerCase();
            const segments = wordLower.split('.');
            const lastSegment = segments[segments.length - 2]; 
            
            if (lastSegment && abbr.includes(lastSegment.replace(/[^a-z]/g, ''))) {
                continue; 
            }
            
            if (i === words.length - 1 || /^[A-Z0-9'"($]/.test(words[i+1])) {
                sentences.push(currentSentence.trim());
                currentSentence = "";
            }
        }
    }
    if (currentSentence.trim().length > 0) {
        sentences.push(currentSentence.trim());
    }
  });

  return sentences;
}
