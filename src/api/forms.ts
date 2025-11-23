import client from './client'
import type { 
  Form, 
  CreateFormRequest, 
  UpdateFormRequest, 
  AddFieldRequest,
  PaginatedResponse 
} from '@/types/form'

export const formsApi = {
  list(params?: any) {
    return client.get<PaginatedResponse<Form>>('/forms', { params })
  },

  get(id: string) {
    return client.get<Form>(`/forms/${id}`)
  },

  create(data: CreateFormRequest) {
    return client.post<Form>('/forms', data)
  },

  update(id: string, data: UpdateFormRequest) {
    return client.patch<Form>(`/forms/${id}`, data)
  },

  delete(id: string) {
    return client.delete(`/forms/${id}`)
  },

  publish(id: string) {
    return client.post<Form>(`/forms/${id}/publish`)
  },

  addField(id: string, data: AddFieldRequest) {
    return client.post<Form>(`/forms/${id}/fields`, data)
  },

  removeField(id: string, fieldId: string) {
    return client.delete(`/forms/${id}/fields/${fieldId}`)
  }
}
