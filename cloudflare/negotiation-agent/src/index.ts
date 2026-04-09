import { Agent, type Connection, routeAgentRequest } from "agents";

type BranchScore = {
  branchId: string;
  objectiveScore: number;
  welfare: number;
  risk: number;
};

type NegotiationState = {
  runs: Record<string, BranchScore[]>;
};

interface Env {}

export class NegotiationAgent extends Agent<Env, NegotiationState> {
  initialState: NegotiationState = {
    runs: {},
  };

  async onMessage(connection: Connection, message: string) {
    const payload = JSON.parse(message) as {
      runId: string;
      scores: BranchScore[];
    };
    this.setState({
      ...this.state,
      runs: {
        ...this.state.runs,
        [payload.runId]: payload.scores,
      },
    });
    connection.send(
      JSON.stringify({
        type: "stored",
        runId: payload.runId,
        count: payload.scores.length,
      })
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routeAgentRequest(request, env)) ??
      new Response(
        JSON.stringify({
          ok: true,
          service: "zeus-negotiation-agent",
          hint: "Connect via /agents/NegotiationAgent/{instance-id}",
        }),
        { headers: { "content-type": "application/json" } }
      )
    );
  },
};
