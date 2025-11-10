<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentUploadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'belge_adi' => 'required|string|max:255',
            'tip' => 'required|string|max:100',
            'file' => [
                'required',
                'file',
                'max:10240', // 10MB
                'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'customer_id.required' => 'Müşteri seçimi zorunludur.',
            'customer_id.exists' => 'Seçilen müşteri bulunamadı.',
            'belge_adi.required' => 'Belge adı zorunludur.',
            'tip.required' => 'Belge tipi zorunludur.',
            'file.required' => 'Dosya yüklenmesi zorunludur.',
            'file.file' => 'Geçerli bir dosya yüklemelisiniz.',
            'file.max' => 'Dosya boyutu en fazla 10MB olabilir.',
            'file.mimes' => 'Sadece PDF, JPG, PNG, DOC, DOCX, XLS, XLSX formatları kabul edilir.',
        ];
    }
}

