<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FileType;

class FileTypeController extends Controller
{
    public function index()
    {
        $fileTypes = FileType::active()->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $fileTypes,
        ]);
    }
}

