import type { Lead, LeadInput } from '@/lib/repos/leads'
import type { Job, JobInput } from '@/lib/repos/jobs'
import type { Template } from '@/lib/repos/templates'
import type { Generation } from '@/lib/repos/generations'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}

export const api = {
  listLeads: () => fetch('/api/leads').then(json<Lead[]>),
  getLead: (id: number) => fetch(`/api/leads/${id}`).then(json<Lead>),
  updateLead: (id: number, patch: Partial<LeadInput>) =>
    fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(json<Lead>),
  createLead: (input: LeadInput) =>
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }).then(json<{ id: number }>),
  deleteLead: (id: number) =>
    fetch(`/api/leads/${id}`, { method: 'DELETE' }).then(json<{ ok: boolean }>),

  listJobs: () => fetch('/api/jobs').then(json<Job[]>),
  getJob: (id: number) => fetch(`/api/jobs/${id}`).then(json<Job>),
  updateJob: (id: number, patch: Partial<JobInput>) =>
    fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(json<Job>),
  createJob: (input: JobInput) =>
    fetch('/api/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }).then(json<{ id: number }>),
  deleteJob: (id: number) =>
    fetch(`/api/jobs/${id}`, { method: 'DELETE' }).then(json<{ ok: boolean }>),

  listTemplates: () => fetch('/api/templates').then(json<Template[]>),

  generate: (body: {
    subjectType: 'lead' | 'job'
    subjectId: number
    templateId: number
    extraInstructions?: string
  }) =>
    fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then(json<{ id: number; content: string; generator: string }>),
}

export type { Lead, Job, Template, Generation }
