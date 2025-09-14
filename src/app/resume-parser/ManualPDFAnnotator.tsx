"use client";
import { useState, useEffect, useRef } from "react";
import { Button, PrimaryButton } from "components/Button";

interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
}

interface TableAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  rows: number[];
  columns: number[];
  textItems: TextItem[];
}

interface ManualPDFAnnotatorProps {
  fileUrl: string;
  onAnnotationsChange: (annotations: any) => void;
  viewOnly?: boolean;
}

export const ManualPDFAnnotator = ({
  fileUrl,
  onAnnotationsChange,
  viewOnly = false,
}: ManualPDFAnnotatorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);

  const [tables, setTables] = useState<TableAnnotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'create-table' | 'add-row' | 'add-column'>('view');
  const [extractedTables, setExtractedTables] = useState<any[]>([]);
  const [isCreatingTable, setIsCreatingTable] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // PDF rendering state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageTextItems, setPageTextItems] = useState<TextItem[]>([]);
  const [scale, setScale] = useState(1.0); // Start with fit-to-width scale

  useEffect(() => {
    loadPDF();
  }, [fileUrl]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale]);

  const loadPDF = async () => {
    try {
      // Import PDF.js dynamically
      const pdfjs = await import('pdfjs-dist');
      // @ts-ignore
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

      const loadingTask = pdfjs.getDocument(fileUrl);
      const pdf = await loadingTask.promise;

      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);

      // Calculate scale to fit container width
      const containerWidth = containerRef.current.clientWidth - 32; // Account for padding
      const originalViewport = page.getViewport({ scale: 1 });
      const fitScale = containerWidth / originalViewport.width;
      const actualScale = Math.min(fitScale, scale);

      const viewport = page.getViewport({ scale: actualScale });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Update SVG overlay dimensions
      if (overlayRef.current) {
        overlayRef.current.setAttribute('width', viewport.width.toString());
        overlayRef.current.setAttribute('height', viewport.height.toString());
      }

      // Clear canvas with white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        // Render text only - no images, no annotations
        renderTextLayer: true,
        renderAnnotationLayer: false,
        renderInteractiveForms: false,
      };

      await page.render(renderContext).promise;

      // Extract text items from the page
      const textContent = await page.getTextContent();
      const textItems: TextItem[] = textContent.items.map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: viewport.height - item.transform[5], // Flip Y coordinate
        width: item.width,
        height: item.height,
        fontName: item.fontName,
        fontSize: item.transform[0],
      }));

      setPageTextItems(textItems);
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewOnly || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    if (mode === 'create-table') {
      setStartPos({ x, y });
      setIsDrawing(true);
      setIsCreatingTable(true);
    } else if (mode === 'add-row' && selectedTable) {
      // Add row at clicked Y position
      const table = tables.find(t => t.id === selectedTable);
      if (table && y >= table.y && y <= table.y + table.height) {
        setTables(tables.map(t =>
          t.id === selectedTable
            ? { ...t, rows: [...t.rows, y].sort((a, b) => a - b) }
            : t
        ));
      }
      setMode('view');
    } else if (mode === 'add-column' && selectedTable) {
      // Add column at clicked X position
      const table = tables.find(t => t.id === selectedTable);
      if (table && x >= table.x && x <= table.x + table.width) {
        setTables(tables.map(t =>
          t.id === selectedTable
            ? { ...t, columns: [...t.columns, x].sort((a, b) => a - b) }
            : t
        ));
      }
      setMode('view');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    // Update current rectangle for preview
    setCurrentRect({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    const tableRect = {
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    };

    // Only create table if rectangle is big enough
    if (tableRect.width > 20 && tableRect.height > 20) {
      // Find text items within the rectangle
      const textItemsInTable = pageTextItems.filter(item =>
        item.x >= tableRect.x &&
        item.x + item.width <= tableRect.x + tableRect.width &&
        item.y >= tableRect.y &&
        item.y + item.height <= tableRect.y + tableRect.height
      );

      const newTable: TableAnnotation = {
        id: Date.now().toString(),
        ...tableRect,
        page: currentPage,
        rows: [],
        columns: [],
        textItems: textItemsInTable,
      };

      setTables([...tables, newTable]);
      setSelectedTable(newTable.id);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentRect(null);
    setIsCreatingTable(false);
    setMode('view');
  };


  const extractTables = () => {
    if (tables.length === 0) return;

    try {
      const extractedData = tables.map((table) => {
        // Create grid structure
        const rows = table.rows.length + 1;
        const columns = table.columns.length + 1;

        // Sort row and column positions
        const sortedRows = [table.y, ...table.rows, table.y + table.height].sort((a, b) => a - b);
        const sortedCols = [table.x, ...table.columns, table.x + table.width].sort((a, b) => a - b);

        // Create 2D grid to place text items
        const grid: string[][] = Array(rows).fill(null).map(() => Array(columns).fill(''));

        // Place each text item in the appropriate grid cell
        table.textItems.forEach((textItem) => {
          // Find which row and column this text item belongs to
          let rowIndex = 0;
          let colIndex = 0;

          for (let i = 0; i < sortedRows.length - 1; i++) {
            if (textItem.y >= sortedRows[i] && textItem.y < sortedRows[i + 1]) {
              rowIndex = i;
              break;
            }
          }

          for (let i = 0; i < sortedCols.length - 1; i++) {
            if (textItem.x >= sortedCols[i] && textItem.x < sortedCols[i + 1]) {
              colIndex = i;
              break;
            }
          }

          // Add text to the cell (handle multiple text items per cell)
          if (grid[rowIndex] && grid[rowIndex][colIndex] !== undefined) {
            grid[rowIndex][colIndex] = grid[rowIndex][colIndex]
              ? grid[rowIndex][colIndex] + ' ' + textItem.text
              : textItem.text;
          }
        });

        return {
          tableId: table.id,
          page: table.page,
          bounds: {
            x: table.x,
            y: table.y,
            width: table.width,
            height: table.height,
          },
          gridStructure: {
            rows: rows,
            columns: columns,
          },
          data: grid,
          textItems: table.textItems,
        };
      });

      setExtractedTables(extractedData);
      onAnnotationsChange(extractedData);
    } catch (error) {
      console.error('Error extracting tables:', error);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b rounded-t-lg flex-wrap">
        {/* Page Navigation */}
        <Button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
        >
          Prev
        </Button>

        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
        >
          Next
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Zoom Controls */}
        <Button
          onClick={zoomOut}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
        >
          Zoom -
        </Button>

        <span className="text-sm text-gray-600">
          {Math.round(scale * 100)}%
        </span>

        <Button
          onClick={zoomIn}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
        >
          Zoom +
        </Button>

        {!viewOnly && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Table Creation */}
            <Button
              onClick={() => setMode(mode === 'create-table' ? 'view' : 'create-table')}
              className={`px-3 py-1 text-sm border rounded hover:bg-gray-100 ${
                mode === 'create-table'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300'
              }`}
            >
              {mode === 'create-table' ? 'Cancel' : 'Create Table'}
            </Button>

            {/* Grid Controls */}
            <Button
              onClick={() => setMode(mode === 'add-row' ? 'view' : 'add-row')}
              disabled={!selectedTable}
              className={`px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 ${
                mode === 'add-row'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300'
              }`}
            >
              {mode === 'add-row' ? 'Click to Add Row' : 'Add Row'}
            </Button>

            <Button
              onClick={() => setMode(mode === 'add-column' ? 'view' : 'add-column')}
              disabled={!selectedTable}
              className={`px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 ${
                mode === 'add-column'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300'
              }`}
            >
              {mode === 'add-column' ? 'Click to Add Column' : 'Add Column'}
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Extract */}
            <PrimaryButton
              onClick={extractTables}
              disabled={tables.length === 0}
              className={tables.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
            >
              Extract Tables
            </PrimaryButton>

            {/* Help Button */}
            <div className="ml-auto relative group">
              <Button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 bg-blue-50 text-blue-700">
                Help
              </Button>
              <div className="absolute right-0 top-8 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                <p className="font-medium text-sm mb-2">How to use Manual Annotation:</p>
                <ol className="list-decimal list-inside text-xs space-y-1 text-gray-700">
                  <li>Click <strong>"Create Table"</strong> → Click and drag to select area</li>
                  <li>Click on created table (blue box) to select it</li>
                  <li>Click <strong>"Add Row"</strong> → Click inside table where you want the horizontal line</li>
                  <li>Click <strong>"Add Column"</strong> → Click inside table where you want the vertical line</li>
                  <li>Click <strong>"Extract Tables"</strong> to get structured data</li>
                </ol>
                <p className="mt-2 text-xs text-blue-600">
                  💡 Green boxes appear only when dragging to create tables
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="text-xs text-gray-500 mr-4">
              {mode === 'create-table' && 'Click and drag to create a table'}
              {mode === 'add-row' && 'Click inside selected table to add horizontal line'}
              {mode === 'add-column' && 'Click inside selected table to add vertical line'}
              {selectedTable && mode === 'view' && `Table selected • Rows: ${tables.find(t => t.id === selectedTable)?.rows.length || 0} • Cols: ${tables.find(t => t.id === selectedTable)?.columns.length || 0}`}
              {tables.length > 0 && !selectedTable && mode === 'view' && `${tables.length} table(s) created`}
            </div>
          </>
        )}
      </div>

      {/* PDF Viewer with Annotation Overlay */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-4"
      >
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            className={`border border-gray-300 ${
              mode === 'create-table' ? 'cursor-crosshair' :
              mode === 'add-row' ? 'cursor-row-resize' :
              mode === 'add-column' ? 'cursor-col-resize' :
              'cursor-pointer'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={(e) => {
              if (mode === 'view') {
                // Select table on click
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;

                const x = (e.clientX - rect.left) * ((canvasRef.current?.width || 0) / rect.width);
                const y = (e.clientY - rect.top) * ((canvasRef.current?.height || 0) / rect.height);

                const clickedTable = tables.find(table =>
                  x >= table.x && x <= table.x + table.width &&
                  y >= table.y && y <= table.y + table.height &&
                  table.page === currentPage
                );

                setSelectedTable(clickedTable?.id || null);
              }
            }}
          />

          {/* SVG overlay for tables and text detection */}
          <svg
            ref={overlayRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ zIndex: 10 }}
          >
            {/* Show detected text items only when actively creating table */}
            {isCreatingTable && pageTextItems.map((textItem, index) => (
              <rect
                key={`text-${index}`}
                x={textItem.x}
                y={textItem.y}
                width={textItem.width}
                height={textItem.height}
                fill="rgba(34, 197, 94, 0.2)"
                stroke="rgba(34, 197, 94, 0.5)"
                strokeWidth="1"
              />
            ))}

            {/* Current drawing rectangle */}
            {currentRect && (
              <rect
                x={currentRect.x}
                y={currentRect.y}
                width={currentRect.width}
                height={currentRect.height}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}

            {/* Existing tables */}
            {tables
              .filter(table => table.page === currentPage)
              .map((table) => (
                <g key={table.id}>
                  {/* Main rectangle */}
                  <rect
                    x={table.x}
                    y={table.y}
                    width={table.width}
                    height={table.height}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="#3b82f6"
                    strokeWidth={selectedTable === table.id ? "3" : "2"}
                    className={selectedTable === table.id ? "stroke-red-500" : ""}
                  />

                  {/* Text items within table */}
                  {table.textItems.map((textItem, index) => (
                    <rect
                      key={`table-text-${index}`}
                      x={textItem.x}
                      y={textItem.y}
                      width={textItem.width}
                      height={textItem.height}
                      fill="rgba(34, 197, 94, 0.3)"
                      stroke="rgba(34, 197, 94, 0.7)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Row lines */}
                  {table.rows.map((rowY, index) => (
                    <line
                      key={`row-${index}`}
                      x1={table.x}
                      y1={rowY}
                      x2={table.x + table.width}
                      y2={rowY}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />
                  ))}

                  {/* Column lines */}
                  {table.columns.map((colX, index) => (
                    <line
                      key={`col-${index}`}
                      x1={colX}
                      y1={table.y}
                      x2={colX}
                      y2={table.y + table.height}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />
                  ))}
                </g>
              ))}
          </svg>
        </div>
      </div>

    </div>
  );
};