<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Dealer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $password = Hash::make('password');

        // Get roles
        $superadminRole = Role::where('name', 'superadmin')->first();
        $birincilAdminRole = Role::where('name', 'birincil-admin')->first();
        $ikinciAdminRole = Role::where('name', 'ikincil-admin')->first();
        $evrakBirimiRole = Role::where('name', 'evrak-birimi')->first();
        $bayiRole = Role::where('name', 'bayi')->first();
        $musteriRole = Role::where('name', 'musteri')->first();

        // Get first dealer for demo
        $dealer = Dealer::first();

        $users = [
            [
                'name' => 'Süper Admin',
                'email' => 'admin@sigorta.com',
                'password' => $password,
                'role_id' => $superadminRole->id,
                'is_active' => true,
            ],
            [
                'name' => 'Birincil Admin',
                'email' => 'birincil@sigorta.com',
                'password' => $password,
                'role_id' => $birincilAdminRole->id,
                'is_active' => true,
            ],
            [
                'name' => 'İkincil Admin',
                'email' => 'ikincil@sigorta.com',
                'password' => $password,
                'role_id' => $ikinciAdminRole->id,
                'is_active' => true,
            ],
            [
                'name' => 'Evrak Sorumlusu',
                'email' => 'evrak@sigorta.com',
                'password' => $password,
                'role_id' => $evrakBirimiRole->id,
                'is_active' => true,
            ],
            [
                'name' => 'Demo Bayi',
                'email' => 'bayi@sigorta.com',
                'phone' => '0555 123 4567',
                'password' => $password,
                'role_id' => $bayiRole->id,
                'dealer_id' => $dealer?->id,
                'is_active' => true,
            ],
            [
                'name' => 'Demo Müşteri',
                'email' => 'musteri@sigorta.com',
                'phone' => '0555 765 4321',
                'tc_no' => '12345678901',
                'password' => $password,
                'role_id' => $musteriRole->id,
                'is_active' => true,
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }
    }
}

