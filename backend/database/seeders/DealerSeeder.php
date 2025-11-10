<?php

namespace Database\Seeders;

use App\Models\Dealer;
use Illuminate\Database\Seeder;

class DealerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dealers = [
            [
                'dealer_name' => 'Oksijen Sigorta İstanbul',
                'contact_person' => 'Mehmet Yılmaz',
                'phone' => '0212 555 0001',
                'email' => 'istanbul@oksijen.com',
                'address' => 'Levent Mahallesi, İş Kuleleri, No:15 Kat:8',
                'city' => 'İstanbul',
                'tax_number' => '1234567890',
                'status' => 'active',
            ],
            [
                'dealer_name' => 'Oksijen Sigorta Ankara',
                'contact_person' => 'Ayşe Demir',
                'phone' => '0312 555 0002',
                'email' => 'ankara@oksijen.com',
                'address' => 'Çankaya, Atatürk Bulvarı, No:123',
                'city' => 'Ankara',
                'tax_number' => '1234567891',
                'status' => 'active',
            ],
            [
                'dealer_name' => 'Oksijen Sigorta İzmir',
                'contact_person' => 'Can Öztürk',
                'phone' => '0232 555 0003',
                'email' => 'izmir@oksijen.com',
                'address' => 'Alsancak, Kıbrıs Şehitleri Caddesi, No:45',
                'city' => 'İzmir',
                'tax_number' => '1234567892',
                'status' => 'active',
            ],
            [
                'dealer_name' => 'Oksijen Sigorta Bursa',
                'contact_person' => 'Zeynep Kaya',
                'phone' => '0224 555 0004',
                'email' => 'bursa@oksijen.com',
                'address' => 'Nilüfer, Atatürk Caddesi, No:78',
                'city' => 'Bursa',
                'tax_number' => '1234567893',
                'status' => 'active',
            ],
            [
                'dealer_name' => 'Oksijen Sigorta Antalya',
                'contact_person' => 'Ahmet Şahin',
                'phone' => '0242 555 0005',
                'email' => 'antalya@oksijen.com',
                'address' => 'Muratpaşa, Lara Caddesi, No:234',
                'city' => 'Antalya',
                'tax_number' => '1234567894',
                'status' => 'active',
            ],
        ];

        foreach ($dealers as $dealer) {
            Dealer::updateOrCreate(
                ['phone' => $dealer['phone']],
                $dealer
            );
        }
    }
}

