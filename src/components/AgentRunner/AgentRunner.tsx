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
  return (
    <section className={styles.container} aria-label="Agent Runner">
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          disabled={!configured || running}
          onClick={onRun}
        >
          {running ? "Running..." : "Run"}
        </button>
        {!configured ? (
          <span className={styles.hint}>
            Enter API URL and Model ID above to enable.
          </span>
        ) : null}
      </div>

      {error ? (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      ) : null}

      <output className={styles.output} aria-live="polite">
        {output || (running ? "Waiting for response..." : "No output yet.")}
      </output>
    </section>
  );
}
