import { Component, type ReactNode, useCallback, useState } from "react";
import {
  type OpenUIError,
  type ParseResult,
  Renderer,
} from "@openuidev/react-lang";
import type { EpisodeMetadata } from "@/agent";
import { Alert, Card, CardContent, Flex, Skeleton } from "@/components/ui";
import {
  EpisodeMetadataProvider,
  SeekTimestampProvider,
} from "./components/EpisodeMetadataContext";
import { trustReportLibrary } from "./library";
import styles from "./TrustReportRenderer.module.css";
import { normalizeOpenUiResponse } from "./utils";

interface TrustReportRendererProps {
  response: string;
  isStreaming: boolean;
  metadata?: EpisodeMetadata | null;
  onSeekTimestamp?: (seconds: number) => void;
  onFatalError?: (message: string) => void;
}

interface ErrorBoundaryProps {
  onFatalError?: (message: string) => void;
  onCatchError: (message: string) => void;
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class OpenUIErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    const message = error.message || "Failed to render structured Trust Report.";
    this.props.onCatchError(message);
    this.props.onFatalError?.(message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function RawFallbackView({
  response,
  errorDetails,
}: {
  response: string;
  errorDetails: string[];
}) {
  const hasErrors = errorDetails.length > 0;

  return (
    <div className={styles.rendererRoot}>
      <Alert variant={hasErrors ? "danger" : "warning"}>
        <div>
          <strong>
            Could not render structured Trust Report. Showing raw output instead.
          </strong>
          {hasErrors ? (
            <ul className={styles.errorList}>
              {errorDetails.slice(0, 3).map((detail, index) => (
                <li key={`${detail}-${index}`}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </Alert>
      <Card as="div">
        <CardContent>
          <pre className={styles.rawFallback}>{response}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

export function TrustReportRenderer({
  response,
  isStreaming,
  metadata = null,
  onSeekTimestamp,
  onFatalError,
}: TrustReportRendererProps) {
  const [parseState, setParseState] = useState<{
    hasReported: boolean;
    result: ParseResult | null;
  }>({ hasReported: false, result: null });

  const [openUiErrors, setOpenUiErrors] = useState<OpenUIError[]>([]);
  const [caughtError, setCaughtError] = useState<string | null>(null);

  const handleParseResult = useCallback((result: ParseResult | null) => {
    setParseState({ hasReported: true, result });
  }, []);

  const handleErrors = useCallback((errors: OpenUIError[]) => {
    setOpenUiErrors(errors);
  }, []);

  const handleCatchError = useCallback((message: string) => {
    setCaughtError(message);
  }, []);

  const normalized = normalizeOpenUiResponse(response);
  const hasContent = response.trim().length > 0;

  if (!hasContent) {
    return null;
  }

  const effectiveParseResult = parseState.result;
  const hasParseReported = parseState.hasReported;
  const effectiveErrors = openUiErrors;
  const effectiveCaughtError = caughtError;

  const errorDetails = effectiveCaughtError
    ? [effectiveCaughtError]
    : effectiveErrors.map((err) => err.message);

  const showFallback =
    !isStreaming &&
    (normalized.trim().length === 0 ||
      Boolean(effectiveCaughtError) ||
      (hasParseReported && !effectiveParseResult?.root) ||
      (effectiveErrors.length > 0 && !effectiveParseResult?.root));

  if (showFallback) {
    return (
      <RawFallbackView response={response} errorDetails={errorDetails} />
    );
  }

  const showPendingRootSkeleton =
    isStreaming &&
    effectiveErrors.length === 0 &&
    !effectiveCaughtError &&
    (!effectiveParseResult || !effectiveParseResult.root);

  const showPartialWarning =
    !isStreaming &&
    Boolean(effectiveParseResult?.root) &&
    effectiveErrors.length > 0;

  return (
    <SeekTimestampProvider value={onSeekTimestamp ?? null}>
      <EpisodeMetadataProvider value={metadata}>
        <OpenUIErrorBoundary
          onFatalError={onFatalError}
          onCatchError={handleCatchError}
          fallback={
            <RawFallbackView response={response} errorDetails={errorDetails} />
          }
        >
          <div className={styles.rendererRoot}>
            {showPartialWarning ? (
              <Alert variant="warning">
                <div>
                  <strong>
                    Trust Report rendered with OpenUI validation warnings.
                  </strong>
                  <ul className={styles.errorList}>
                    {errorDetails.slice(0, 3).map((detail, index) => (
                      <li key={`${detail}-${index}`}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </Alert>
            ) : null}

            {showPendingRootSkeleton ? (
              <Card as="div">
                <CardContent>
                  <Flex direction="column" gap={3}>
                    <Skeleton width="45%" height="1.25rem" />
                    <Skeleton width="100%" />
                    <Skeleton width="88%" />
                    <Skeleton width="72%" />
                  </Flex>
                </CardContent>
              </Card>
            ) : null}

            <Renderer
              library={trustReportLibrary}
              response={normalized}
              isStreaming={isStreaming}
              onParseResult={handleParseResult}
              onError={handleErrors}
            />
          </div>
        </OpenUIErrorBoundary>
      </EpisodeMetadataProvider>
    </SeekTimestampProvider>
  );
}
