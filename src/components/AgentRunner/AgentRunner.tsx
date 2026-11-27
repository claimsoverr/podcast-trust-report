import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Skeleton,
} from "@/components/ui";
import styles from "./AgentRunner.module.css";

interface AgentRunnerProps {
  configured: boolean;
  running: boolean;
  output: string;
  error: string | null;
  onRun: () => void;
}

export function AgentRunner({
  configured,
  running,
  output,
  error,
  onRun,
}: AgentRunnerProps) {
  const showSkeleton = running && !output;

  return (
    <Flex as="section" direction="column" gap={4} aria-label="Agent Runner">
      <Flex align="center" gap={3} wrap>
        <Button
          variant="primary"
          isLoading={running}
          disabled={!configured || running}
          onClick={onRun}
        >
          {running ? "Running..." : "Run"}
        </Button>
        {!configured ? (
          <span className={styles.hint}>
            Enter API URL and Model ID above to enable.
          </span>
        ) : null}
      </Flex>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Card as="div">
        <CardContent>
          <output
            className={styles.output}
            aria-live="polite"
            aria-busy={showSkeleton || undefined}
          >
            {showSkeleton ? (
              <Flex direction="column" gap={2}>
                <span className="visually-hidden">Waiting for response...</span>
                <Skeleton width="92%" />
                <Skeleton width="100%" />
                <Skeleton width="78%" />
              </Flex>
            ) : (
              output || "No output yet."
            )}
          </output>
        </CardContent>
      </Card>
    </Flex>
  );
}
