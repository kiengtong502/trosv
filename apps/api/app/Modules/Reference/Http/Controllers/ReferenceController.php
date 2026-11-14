<?php

namespace App\Modules\Reference\Http\Controllers;

use App\Modules\Reference\Http\Resources\CityResource;
use App\Modules\Reference\Http\Resources\SchoolResource;
use App\Modules\Reference\Http\Resources\WardResource;
use App\Modules\Reference\Models\Amenity;
use App\Modules\Reference\Models\City;
use App\Modules\Reference\Models\School;
use App\Modules\Reference\Models\Ward;
use App\Shared\Http\Controllers\Controller;
use App\Shared\Support\ServiceArea;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

/**
 * Reference data for dropdowns and the map (API_CONTRACT §4).
 * Cascade: City -> Ward/School qua tham số city_id tùy chọn.
 */
class ReferenceController extends Controller
{
    /** GET /api/cities - 34 đơn vị hành chính cấp tỉnh, xếp theo tên A-Z. */
    public function cities(): AnonymousResourceCollection
    {
        $cities = Cache::remember('reference:service-area:cities:v1', 3600, fn () => City::whereIn('id', ServiceArea::cityIds())->orderBy('name')->get());

        return CityResource::collection($cities);
    }

    /** GET /api/wards?city_id= - optional city filter. */
    public function wards(Request $request): AnonymousResourceCollection
    {
        $wards = Ward::query()->whereIn('id', ServiceArea::wardIds())
            ->with('city')
            ->when(
                $request->filled('city_id'),
                fn ($q) => $q->where('city_id', $request->integer('city_id'))
            )
            ->orderBy('name')
            ->get();

        return WardResource::collection($wards);
    }

    /** GET /api/schools?city_id= - optional city filter. */
    public function schools(Request $request): AnonymousResourceCollection
    {
        // ward eager-loaded de FE loc phong theo phuong cua truong
        // (GET /listings?ward_id=...) ma khong them request nao.
        $schools = School::query()->whereIn('id', ServiceArea::schoolIds())
            ->with(['city', 'ward'])
            ->when(
                $request->filled('city_id'),
                fn ($q) => $q->where('city_id', $request->integer('city_id'))
            )
            ->orderBy('name')
            ->get();

        /** @var array{schools: list<array{name: string, campus_name: string, address: string}>} $details */
        $details = File::json(database_path('data/hcm-schools-main-campuses.json'));
        $request->attributes->set('school_details', array_column($details['schools'], null, 'name'));

        return SchoolResource::collection($schools);
    }

    /** GET /api/amenities */
    public function amenities(): JsonResponse
    {
        $amenities = Cache::remember(
            'reference:amenities',
            3600,
            fn () => Amenity::orderBy('name')->get(['id', 'name'])
        );

        return response()->json([
            'data' => $amenities,
        ]);
    }
}
