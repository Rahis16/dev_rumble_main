import {AgentBrain} from "../backend/src/services/AgentBrain"

const result = await AgentBrain.executeTask(
  "C:\Users\galaxy\Desktop\test-nova",
  "Create a file called nova-test.txt and write 'Nova is alive!' inside it."
);

console.log(result);