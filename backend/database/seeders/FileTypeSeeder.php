<?php

namespace Database\Seeders;

use App\Models\FileType;
use Illuminate\Database\Seeder;

class FileTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $fileTypes = [
            [
                'name' => 'deger-kaybi',
                'label' => 'Değer Kaybı Dosyası',
                'color' => '#22c55e',
                'description' => 'Araç değer kaybı dosyaları',
                'required_documents' => ['Kimlik', 'Ruhsat', 'Hasar Fotoğrafları', 'Ekspertiz Raporu'],
                'is_active' => true,
            ],
            [
                'name' => 'parca-iscilik',
                'label' => 'Parça ve İşçilik Farkı Dosyası',
                'color' => '#3b82f6',
                'description' => 'Parça ve işçilik farkı dosyaları',
                'required_documents' => ['Kimlik', 'Ruhsat', 'Fatura', 'Onarım Belgesi'],
                'is_active' => true,
            ],
            [
                'name' => 'arac-mahrumiyeti',
                'label' => 'Araç Mahrumiyeti Dosyası',
                'color' => '#f97316',
                'description' => 'Araç kullanım mahrumiyeti dosyaları',
                'required_documents' => ['Kimlik', 'Ruhsat', 'Kira Sözleşmesi', 'Ödeme Belgesi'],
                'is_active' => true,
            ],
            [
                'name' => 'pert-farki',
                'label' => 'Pert Farkı Dosyası',
                'color' => '#ef4444',
                'description' => 'Pert farkı dosyaları',
                'required_documents' => ['Kimlik', 'Ruhsat', 'Ekspertiz Raporu', 'Hasar Tespit Tutanağı'],
                'is_active' => true,
            ],
        ];

        foreach ($fileTypes as $fileType) {
            FileType::updateOrCreate(
                ['name' => $fileType['name']],
                $fileType
            );
        }
    }
}

