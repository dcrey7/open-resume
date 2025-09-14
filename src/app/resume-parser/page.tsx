"use client";
import { useState, useEffect } from "react";
import { readPdf } from "lib/parse-resume-from-pdf/read-pdf";
import type { TextItems } from "lib/parse-resume-from-pdf/types";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { groupLinesIntoSections } from "lib/parse-resume-from-pdf/group-lines-into-sections";
import { extractResumeFromSections } from "lib/parse-resume-from-pdf/extract-resume-from-sections";
import { ResumeDropzone } from "components/ResumeDropzone";
import { cx } from "lib/cx";
import { Heading, Link, Paragraph } from "components/documentation";
import { ResumeTable } from "resume-parser/ResumeTable";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import { ResumeParserAlgorithmArticle } from "resume-parser/ResumeParserAlgorithmArticle";
import { ParsingMethodSelector } from "resume-parser/ParsingMethodSelector";
import { ManualPDFAnnotator } from "resume-parser/ManualPDFAnnotator";

const RESUME_EXAMPLES = [
  {
    fileUrl: "resume-example/laverne-resume.pdf",
    description: (
      <span>
        Borrowed from University of La Verne Career Center -{" "}
        <Link href="https://laverne.edu/careers/wp-content/uploads/sites/15/2010/12/Undergraduate-Student-Resume-Examples.pdf">
          Link
        </Link>
      </span>
    ),
  },
  {
    fileUrl: "resume-example/openresume-resume.pdf",
    description: (
      <span>
        Created with OpenResume resume builder -{" "}
        <Link href="/resume-builder">Link</Link>
      </span>
    ),
  },
];

type ParsingMethod = 'simple' | 'ocr' | 'manual';

const defaultFileUrl = RESUME_EXAMPLES[0]["fileUrl"];
export default function ResumeParser() {
  const [fileUrl, setFileUrl] = useState(defaultFileUrl);
  const [textItems, setTextItems] = useState<TextItems>([]);
  const [parsingMethod, setParsingMethod] = useState<ParsingMethod>('simple');
  const [manualAnnotations, setManualAnnotations] = useState<any>(null);

  const lines = groupTextItemsIntoLines(textItems || []);
  const sections = groupLinesIntoSections(lines);
  const resume = extractResumeFromSections(sections);

  useEffect(() => {
    // Only run simple parsing when method is 'simple'
    if (parsingMethod === 'simple') {
      async function test() {
        const textItems = await readPdf(fileUrl);
        setTextItems(textItems);
      }
      test();
    } else {
      // Clear simple parsing results when using other methods
      setTextItems([]);
    }
  }, [fileUrl, parsingMethod]);

  return (
    <main className="h-full w-full overflow-hidden">
      <div className="grid md:grid-cols-7">
        {/* Left Side - Results */}
        <div className="flex px-8 text-gray-900 md:col-span-3 md:h-[calc(100vh-var(--top-nav-bar-height))] md:overflow-y-scroll">
          <section className="w-full grow">
            <Heading className="text-primary !mt-4">
              Resume Parser
            </Heading>

            {/* Parsing Method Selector */}
            <ParsingMethodSelector
              selectedMethod={parsingMethod}
              onMethodChange={setParsingMethod}
            />

            <div className="mt-3 flex gap-2">
              {RESUME_EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  className={cx(
                    "flex-1 cursor-pointer rounded-md border px-3 py-2 text-sm outline-none hover:bg-gray-50",
                    example.fileUrl === fileUrl
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300"
                  )}
                  onClick={() => setFileUrl(example.fileUrl)}
                >
                  Example {idx + 1}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <ResumeDropzone
                onFileUrlChange={(fileUrl) =>
                  setFileUrl(fileUrl || defaultFileUrl)
                }
                playgroundView={true}
              />
            </div>

            {/* Results Section */}
            <div className="mt-6">
              {parsingMethod === 'simple' && textItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Extracted Information</h3>
                  <ResumeTable resume={resume} />
                </div>
              )}

              {parsingMethod === 'ocr' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium">🚧 OCR Parsing - Coming Soon</p>
                </div>
              )}

              {parsingMethod === 'manual' && manualAnnotations && manualAnnotations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Extracted Tables</h3>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => {
                        const csvContent = manualAnnotations.map((table: any) =>
                          table.data.map((row: string[]) => row.join(',')).join('\n')
                        ).join('\n\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'extracted_tables.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Download CSV
                    </button>
                  </div>

                  {manualAnnotations.map((tableData: any, tableIndex: number) => (
                    <div key={tableIndex} className="mb-6">
                      <h4 className="font-medium mb-2">Table {tableIndex + 1}</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                          <tbody>
                            {tableData.data.map((row: string[], rowIndex: number) => (
                              <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-100' : ''}>
                                {row.map((cell: string, cellIndex: number) => (
                                  <td
                                    key={cellIndex}
                                    className="border border-gray-300 px-2 py-1 text-sm"
                                  >
                                    {cell || ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-12" />
          </section>
        </div>

        {/* Right Side - PDF Viewer */}
        <div className="flex justify-center px-2 md:col-span-4 md:h-[calc(100vh-var(--top-nav-bar-height))] md:justify-start">
          <section className="mt-5 grow px-4 md:px-2 w-full">
            {parsingMethod === 'manual' ? (
              <ManualPDFAnnotator
                fileUrl={fileUrl}
                onAnnotationsChange={setManualAnnotations}
              />
            ) : (
              <ManualPDFAnnotator
                fileUrl={fileUrl}
                onAnnotationsChange={() => {}}
                viewOnly={true}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
