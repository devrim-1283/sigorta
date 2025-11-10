<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'superadmin',
                'display_name' => 'Süper Admin',
                'description' => 'Tüm yetkilere sahip sistem yöneticisi',
                'permissions' => ['*'], // All permissions
                'is_active' => true,
            ],
            [
                'name' => 'birincil-admin',
                'display_name' => 'Birincil Admin',
                'description' => 'Geniş yetkilere sahip yönetici',
                'permissions' => ['manage_customers', 'manage_documents', 'manage_payments', 'view_reports'],
                'is_active' => true,
            ],
            [
                'name' => 'ikincil-admin',
                'display_name' => 'İkincil Admin',
                'description' => 'Sınırlı yönetici yetkileri',
                'permissions' => ['view_customers', 'edit_customers', 'manage_documents'],
                'is_active' => true,
            ],
            [
                'name' => 'evrak-birimi',
                'display_name' => 'Evrak Birimi',
                'description' => 'Evrak yönetimi ve bayi işlemleri',
                'permissions' => ['manage_documents', 'manage_dealers', 'create_customers'],
                'is_active' => true,
            ],
            [
                'name' => 'bayi',
                'display_name' => 'Bayi',
                'description' => 'Bayi kullanıcısı',
                'permissions' => ['view_own_customers', 'view_own_documents'],
                'is_active' => true,
            ],
            [
                'name' => 'musteri',
                'display_name' => 'Müşteri',
                'description' => 'Müşteri kullanıcısı',
                'permissions' => ['view_own_data'],
                'is_active' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}

