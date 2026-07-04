// src/nexus/interfaces/INexus.ts
export interface NexusInterface {
  id: string;
  name: string;
  type: 'skill' | 'model' | 'workflow' | 'agent';
  createdAt: Date;
  updatedAt: Date;
}