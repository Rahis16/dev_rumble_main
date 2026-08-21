import mongoose, { Schema, Document } from 'mongoose';
import fs from 'fs';
import path from 'path';

const MOCK_DB_FILE = path.join(process.cwd(), 'mock_db.json');

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function readMockDb(): Record<string, any[]> {
  try {
    if (fs.existsSync(MOCK_DB_FILE)) {
      return JSON.parse(fs.readFileSync(MOCK_DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading mock DB file', e);
  }
  return {
    projects: [],
    tasks: [],
    decisions: [],
    conversations: [],
    agentreports: []
  };
}

function writeMockDb(data: Record<string, any[]>) {
  try {
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing mock DB file', e);
  }
}

function getCollection(name: string): any[] {
  const db = readMockDb();
  const key = name.toLowerCase() + 's';
  return db[key] || [];
}

function saveCollection(name: string, items: any[]) {
  const db = readMockDb();
  const key = name.toLowerCase() + 's';
  db[key] = items;
  writeMockDb(db);
}

class MockQueryChain<T> extends Array<T> {
  limit(n: number) {
    return new MockQueryChain(...this.slice(0, n));
  }
}

class MockModelWrapper {
  [key: string]: any;
  _id!: string;
  createdAt!: Date;
  
  constructor(modelName: string, data: any) {
    this._modelName = modelName;
    Object.assign(this, data);
    if (!this._id) {
      this._id = generateId();
    }
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
  }

  async save() {
    const items = getCollection(this._modelName);
    const existingIndex = items.findIndex(item => item._id === this._id);
    const docData = { ...this };
    delete docData._modelName;
    
    if (existingIndex >= 0) {
      items[existingIndex] = docData;
    } else {
      items.push(docData);
    }
    saveCollection(this._modelName, items);
    return this;
  }

  toJSON() {
    const copy = { ...this };
    delete copy._modelName;
    return copy;
  }

  toObject() {
    return this.toJSON();
  }
}

function createModelProxy(modelName: string, mongooseModel: any) {
  const proxyHandler = {
    construct(target: any, args: any[]) {
      if (mongoose.connection.readyState === 1) {
        return new mongooseModel(...args);
      } else {
        return new MockModelWrapper(modelName, args[0] || {});
      }
    },
    get(target: any, prop: string) {
      if (mongoose.connection.readyState === 1) {
        const value = mongooseModel[prop];
        if (typeof value === 'function') {
          return value.bind(mongooseModel);
        }
        return value;
      } else {
        if (prop === 'find') {
          return async (query: any = {}) => {
            let items = getCollection(modelName);
            if (query && Object.keys(query).length > 0) {
              items = items.filter(item => {
                for (const [key, val] of Object.entries(query)) {
                  if (item[key] !== val) return false;
                }
                return true;
              });
            }
            const chain = new MockQueryChain(...items.map(item => new MockModelWrapper(modelName, item)));
            return chain;
          };
        }
        if (prop === 'findOne') {
          return async (query: any = {}) => {
            const items = getCollection(modelName);
            const matched = items.find(item => {
              for (const [key, val] of Object.entries(query)) {
                if (item[key] !== val) return false;
              }
              return true;
            });
            return matched ? new MockModelWrapper(modelName, matched) : null;
          };
        }
        if (prop === 'findById') {
          return async (id: string) => {
            const items = getCollection(modelName);
            const matched = items.find(item => item._id === id);
            return matched ? new MockModelWrapper(modelName, matched) : null;
          };
        }
        if (prop === 'findByIdAndUpdate') {
          return async (id: string, update: any, options: any = {}) => {
            const items = getCollection(modelName);
            let index = items.findIndex(item => item._id === id);
            let matched = index >= 0 ? items[index] : null;

            if (!matched) {
              if (options.upsert) {
                matched = { _id: id };
                items.push(matched);
                index = items.length - 1;
              } else {
                return null;
              }
            }

            const fieldsToUpdate = update.$set || update;
            Object.assign(matched, fieldsToUpdate);
            saveCollection(modelName, items);
            return new MockModelWrapper(modelName, matched);
          };
        }
        if (prop === 'findByIdAndDelete') {
          return async (id: string) => {
            const items = getCollection(modelName);
            const index = items.findIndex(item => item._id === id);
            if (index >= 0) {
              const [removed] = items.splice(index, 1);
              saveCollection(modelName, items);
              return new MockModelWrapper(modelName, removed);
            }
            return null;
          };
        }
        if (prop === 'findOneAndUpdate') {
          return async (query: any, update: any, options: any = {}) => {
            const items = getCollection(modelName);
            let matched = items.find(item => {
              for (const [key, val] of Object.entries(query)) {
                if (item[key] !== val) return false;
              }
              return true;
            });

            if (!matched) {
              if (options.upsert) {
                matched = { ...query, _id: generateId() };
                items.push(matched);
              } else {
                return null;
              }
            }

            const fieldsToUpdate = update.$set || update;
            Object.assign(matched, fieldsToUpdate);
            saveCollection(modelName, items);
            return new MockModelWrapper(modelName, matched);
          };
        }
        if (prop === 'countDocuments') {
          return async (query: any = {}) => {
            const items = getCollection(modelName);
            const matched = items.filter(item => {
              for (const [key, val] of Object.entries(query)) {
                if (item[key] !== val) return false;
              }
              return true;
            });
            return matched.length;
          };
        }
        const value = (MockModelWrapper as any)[prop];
        if (typeof value === 'function') {
          return value.bind(MockModelWrapper);
        }
        return value;
      }
    }
  };

  return new Proxy(mongooseModel, proxyHandler);
}

// Project Model
export interface IProject extends Document {
  name: string;
  path: string;
  framework: string;
  activeBranch: string;
  packageManager: string;
  buildTools: string;
  healthStatus: string;
  lastSync: Date;
}

const ProjectSchema: Schema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true, unique: true },
  framework: { type: String, default: 'Unknown' },
  activeBranch: { type: String, default: 'main' },
  packageManager: { type: String, default: 'npm' },
  buildTools: { type: String, default: 'Vite' },
  healthStatus: { type: String, default: 'healthy' },
  lastSync: { type: Date, default: Date.now }
});

const ProjectRaw = mongoose.model<IProject>('Project', ProjectSchema);
export const Project = createModelProxy('Project', ProjectRaw) as unknown as typeof ProjectRaw;

// Task Model
export interface ITask extends Document {
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';
  assignedAgent: string;
  dependsOn: string[];
  createdAt: Date;
  completedAt?: Date;
}

const TaskSchema: Schema = new Schema({
  projectId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed', 'paused'], default: 'pending' },
  assignedAgent: { type: String, default: 'None' },
  dependsOn: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const TaskRaw = mongoose.model<ITask>('Task', TaskSchema);
export const Task = createModelProxy('Task', TaskRaw) as unknown as typeof TaskRaw;

// Conversation Model
export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  audioUrl?: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  projectId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
}

const ConversationSchema: Schema = new Schema({
  projectId: { type: String, required: true },
  title: { type: String, default: 'New Session' },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    text: { type: String, required: true },
    audioUrl: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const ConversationRaw = mongoose.model<IConversation>('Conversation', ConversationSchema);
export const Conversation = createModelProxy('Conversation', ConversationRaw) as unknown as typeof ConversationRaw;

// Decision Model
export interface IDecision extends Document {
  projectId: string;
  title: string;
  content: string;
  rationale: string;
  impact: string;
  timestamp: Date;
}

const DecisionSchema: Schema = new Schema({
  projectId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  rationale: { type: String, default: '' },
  impact: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const DecisionRaw = mongoose.model<IDecision>('Decision', DecisionSchema);
export const Decision = createModelProxy('Decision', DecisionRaw) as unknown as typeof DecisionRaw;

// Agent Report Model
export interface IAgentReport extends Document {
  projectId: string;
  taskId: string;
  agentName: string;
  modelUsed: string;
  filesChanged: string[];
  buildResult: 'success' | 'failure';
  testResult: 'passed' | 'failed' | 'none';
  reportText: string;
  timestamp: Date;
}

const AgentReportSchema: Schema = new Schema({
  projectId: { type: String, required: true },
  taskId: { type: String, required: true },
  agentName: { type: String, required: true },
  modelUsed: { type: String, required: true },
  filesChanged: [{ type: String }],
  buildResult: { type: String, enum: ['success', 'failure'], required: true },
  testResult: { type: String, enum: ['passed', 'failed', 'none'], default: 'none' },
  reportText: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const AgentReportRaw = mongoose.model<IAgentReport>('AgentReport', AgentReportSchema);
export const AgentReport = createModelProxy('AgentReport', AgentReportRaw) as unknown as typeof AgentReportRaw;
