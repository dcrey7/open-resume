"use client";
import { cx } from "lib/cx";

type ParsingMethod = 'simple' | 'ocr' | 'manual';

interface ParsingMethodSelectorProps {
  selectedMethod: ParsingMethod;
  onMethodChange: (method: ParsingMethod) => void;
}

interface MethodInfo {
  id: ParsingMethod;
  name: string;
  description: string;
  accuracy: string;
  badge?: string;
  disabled?: boolean;
}

const PARSING_METHODS: MethodInfo[] = [
  {
    id: 'simple',
    name: 'Simple Parsing',
    description: 'Fast PDF text extraction using OpenResume\'s built-in parser',
    accuracy: 'Good',
  },
  {
    id: 'ocr',
    name: 'OCR Parsing',
    description: 'Advanced OCR for scanned documents and complex layouts',
    accuracy: 'Better',
    badge: 'Coming Soon',
    disabled: true,
  },
  {
    id: 'manual',
    name: 'Manual Annotation',
    description: 'Interactive grid-based extraction for 100% accuracy',
    accuracy: 'Best',
  },
];

export const ParsingMethodSelector = ({
  selectedMethod,
  onMethodChange,
}: ParsingMethodSelectorProps) => {
  return (
    <div className="mt-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Choose Parsing Method
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PARSING_METHODS.map((method) => (
          <div
            key={method.id}
            className={cx(
              "relative cursor-pointer rounded-lg border-2 p-4 shadow-sm transition-colors",
              method.disabled
                ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                : selectedMethod === method.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
            )}
            onClick={() => !method.disabled && onMethodChange(method.id)}
          >
            {method.badge && (
              <div className="absolute -top-2 -right-2">
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  {method.badge}
                </span>
              </div>
            )}

            <div className="flex items-start">
              <input
                type="radio"
                name="parsing-method"
                value={method.id}
                checked={selectedMethod === method.id}
                disabled={method.disabled}
                onChange={() => !method.disabled && onMethodChange(method.id)}
                className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {method.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {method.description}
                </p>
                <div className="mt-2">
                  <span
                    className={cx(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                      method.accuracy === 'Best'
                        ? "bg-green-100 text-green-800"
                        : method.accuracy === 'Better'
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    {method.accuracy} Accuracy
                  </span>
                </div>
              </div>
            </div>

            {method.disabled && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/80 rounded-md px-3 py-1">
                  <span className="text-sm font-medium text-gray-500">
                    Coming Soon
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Method-specific information */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Selected: {PARSING_METHODS.find(m => m.id === selectedMethod)?.name}
          </span>
          <span className="text-xs text-gray-500">
            {selectedMethod === 'simple' && 'Recommended for most users'}
            {selectedMethod === 'ocr' && 'Best for scanned documents'}
            {selectedMethod === 'manual' && 'Perfect for complex layouts'}
          </span>
        </div>
      </div>
    </div>
  );
};