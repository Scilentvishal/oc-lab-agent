/**
 * lib/chunker.js
 * Domain-Aware Pharmaceutical Document Chunker.
 *
 * Why standard character chunking fails in Pharma:
 * 1. Blind character splits sever numerical acceptance limits (e.g., "95.0% - 105.0%").
 * 2. Standalone sentences lose critical context (e.g., "Assay: 90-120%" doesn't state if it's Paracetamol or Amoxicillin).
 *
 * This chunker:
 * 1. Splits by document headers and sections (e.g. `## 2. IMMEDIATE ACTIONS`).
 * 2. Prepends document context breadcrumbs (`[DocumentId | Title | Section]`) to guarantee high-fidelity embedding semantics.
 * 3. Enforces sentence-boundary preservation.
 */

/**
 * Split a raw pharmaceutical markdown document into semantically rich chunks.
 *
 * @param {object} doc - Document object from pharmaCorpus.
 * @param {string} doc.documentId - e.g. "SOP-QC-042".
 * @param {string} doc.title - e.g. "Out of Specification Investigations".
 * @param {string} doc.documentType - e.g. "Standard Operating Procedure".
 * @param {string} doc.version - e.g. "v3.2".
 * @param {string} doc.content - Full markdown text of the document.
 * @param {number} [maxChunkSize=650] - Target maximum characters per chunk.
 * @returns {Array<object>} - Array of chunk objects ready for embedding and upsert.
 */
export function chunkPharmaDocument(doc, maxChunkSize = 650) {
  const { documentId, title, documentType, version, content } = doc;
  const chunks = [];

  // Split content by markdown section headings: lines starting with ## or #
  const sectionRegex = /(^#{1,3}\s+[^\n]+)/gm;
  const parts = content.split(sectionRegex).filter((p) => p.trim().length > 0);

  let currentSectionTitle = "General Information";
  let sectionIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();

    // Check if this part is a header line
    if (part.startsWith("#")) {
      currentSectionTitle = part.replace(/^#+\s*/, "").trim();
      continue;
    }

    // Now 'part' is the body text of the section
    const paragraphs = part.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    let currentAccumulator = "";

    for (const para of paragraphs) {
      if ((currentAccumulator + "\n\n" + para).length > maxChunkSize && currentAccumulator.length > 0) {
        // Finalize current chunk with header context breadcrumb
        const enrichedText = `[${documentId} | ${title} | Section: ${currentSectionTitle}]\n${currentAccumulator.trim()}`;

        chunks.push({
          chunkIndex: chunks.length,
          documentId,
          documentTitle: title,
          documentType,
          version,
          sectionTitle: currentSectionTitle,
          text: enrichedText,
          charCount: enrichedText.length,
        });

        currentAccumulator = para;
      } else {
        currentAccumulator = currentAccumulator
          ? `${currentAccumulator}\n\n${para}`
          : para;
      }
    }

    if (currentAccumulator.length > 0) {
      const enrichedText = `[${documentId} | ${title} | Section: ${currentSectionTitle}]\n${currentAccumulator.trim()}`;

      chunks.push({
        chunkIndex: chunks.length,
        documentId,
        documentTitle: title,
        documentType,
        version,
        sectionTitle: currentSectionTitle,
        text: enrichedText,
        charCount: enrichedText.length,
      });
    }

    sectionIndex++;
  }

  return chunks;
}

/**
 * Chunk a collection of pharmaceutical documents.
 *
 * @param {Array<object>} documents - List of document objects.
 * @returns {Array<object>} - Flattened list of all chunks across all documents.
 */
export function chunkAllDocuments(documents) {
  const allChunks = [];
  let globalPointId = 1;

  for (const doc of documents) {
    const docChunks = chunkPharmaDocument(doc);
    for (const chunk of docChunks) {
      allChunks.push({
        id: globalPointId++,
        ...chunk,
      });
    }
  }

  return allChunks;
}
