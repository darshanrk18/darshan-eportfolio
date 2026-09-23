/**
 * Minimax Web Worker (spec §5.4).
 * Message in:  { board, player, depth }  (EngineRequest)
 * Message out: { column, scores: number[7], nodes, ms }  (EngineResult)
 *
 * Loaded only with the triplay-ai demo via
 * `new Worker(new URL('./minimax.worker.ts', import.meta.url))`-style URLs.
 */

import { bestMove, type EngineRequest } from '../connect4'

const scope = self as unknown as Worker

scope.onmessage = (event: MessageEvent<EngineRequest>) => {
  const { board, player, depth } = event.data
  const result = bestMove(board, player, depth)
  // -Infinity does not survive structured clone consumers uniformly typed as
  // JSON elsewhere; it IS structured-clone-safe, so post as-is.
  scope.postMessage(result)
}
