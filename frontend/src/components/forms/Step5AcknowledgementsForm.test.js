import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import Step5AcknowledgementsForm from './Step5AcknowledgementsForm.vue'

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

vi.mock('../../services/api.js', () => ({
  default: mockApi
}))

vi.mock('../../composables/useApplicantData.js', () => ({
  useApplicantData: () => ({
    applicantData: {
      value: {
        firstName: 'E2E',
        lastName: 'User'
      }
    },
    loading: { value: false }
  })
}))

vi.mock('../../composables/useFormDraft.js', () => ({
  useFormDraft: vi.fn()
}))

vi.mock('../../composables/useDateFormat.js', () => ({
  useDateFormat: () => ({ ready: ref(true) }),
  getTodayInAppTimezone: () => '2026-04-02'
}))

describe('Step5AcknowledgementsForm', () => {
  beforeEach(() => {
    mockApi.get.mockReset()
    mockApi.post.mockReset()
  })

  it('loads handbook url and label from form options', async () => {
    mockApi.get.mockImplementation((url) => {
      if (url === '/settings/form-options') {
        return Promise.resolve({
          data: {
            employee_handbook_url: 'https://example.com/custom-handbook.pdf',
            employee_handbook_label: 'Open Custom Handbook'
          }
        })
      }

      if (url === '/applicants/me') {
        return Promise.resolve({ data: { firstName: 'E2E', lastName: 'User' } })
      }

      return Promise.resolve({ data: {} })
    })

    const wrapper = mount(Step5AcknowledgementsForm, {
      props: {
        sessionSignature: 'data:image/png;base64,abc'
      },
      global: {
        stubs: {
          SignaturePad: {
            template: '<div data-testid="signature-pad"></div>',
            props: ['modelValue']
          }
        }
      }
    })

    await flushPromises()

    const link = wrapper.get('a[href="https://example.com/custom-handbook.pdf"]')
    expect(link.text()).toContain('Open Custom Handbook')
  })

  it('keeps handbook acknowledgement disabled until the handbook link is opened', async () => {
    mockApi.get.mockResolvedValue({ data: {} })

    const wrapper = mount(Step5AcknowledgementsForm, {
      global: {
        stubs: {
          SignaturePad: {
            template: '<div data-testid="signature-pad"></div>',
            props: ['modelValue']
          }
        }
      }
    })

    await flushPromises()

    const checkbox = wrapper.get('input[type="checkbox"]')
    expect(checkbox.attributes('disabled')).toBeDefined()

    await wrapper.get('a').trigger('click')
    await flushPromises()

    expect(wrapper.get('input[type="checkbox"]').attributes('disabled')).toBeUndefined()
  })
})
