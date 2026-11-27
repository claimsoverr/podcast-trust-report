import { Button, Card, CardContent, Flex, Skeleton } from "@/components/ui";
import styles from "./AgentRunner.module.css";

interface AgentRunnerProps {
  running: boolean;
  output: string;
  onRun: () => void;
}

export function AgentRunner({ running, output, onRun }: AgentRunnerProps) {
  const showSkeleton = running && !output;

  return (
    <Flex as="section" direction="column" gap={4} aria-label="Agent Runner">
      <div>
        <Button
          variant="primary"
          isLoading={running}
          disabled={running}
          onClick={onRun}
        >
          {running ? "Running..." : "Run"}
        </Button>
      </div>

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
