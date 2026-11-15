<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ConfidentialityLevel;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed();

        return User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();
    }

    private function category(string $code, array $overrides = []): Category
    {
        return Category::create(array_merge([
            'code'      => $code,
            'name_ar'   => "تصنيف {$code}",
            'name'      => "Category {$code}",
            'is_active' => true,
        ], $overrides));
    }

    public function test_index_returns_document_child_and_type_counts(): void
    {
        $admin = $this->admin();

        $parent = $this->category('PARENT', ['sort_order' => 1]);
        $child  = $this->category('CHILD', ['parent_id' => $parent->id, 'sort_order' => 2]);

        DocumentType::create([
            'category_id' => $parent->id,
            'name'        => 'Procedure',
            'name_ar'     => 'إجراء',
            'code'        => 'PROC',
            'prefix'      => 'PRC',
        ]);

        Document::create([
            'document_number'          => 'CAT-COUNT-1',
            'title'                    => 'وثيقة لاختبار العدّاد',
            'document_type_id'         => DocumentType::firstOrFail()->id,
            'category_id'              => $child->id,
            'department_id'            => Department::firstOrFail()->id,
            'created_by'               => $admin->id,
            'status_id'                => Status::where('name', 'new')->firstOrFail()->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            'document_date'            => now()->toDateString(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/categories')
            ->assertOk();

        $rows = collect($response->json('data'))->keyBy('code');

        $this->assertSame(1, $rows['PARENT']['children_count']);
        $this->assertSame(1, $rows['PARENT']['document_types_count']);
        $this->assertSame(0, $rows['PARENT']['documents_count']);
        $this->assertSame(1, $rows['CHILD']['documents_count']);
    }

    public function test_a_category_cannot_be_its_own_parent(): void
    {
        $admin = $this->admin();
        $category = $this->category('SELF');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/categories/{$category->id}", ['parent_id' => $category->id])
            ->assertStatus(422);

        $this->assertNull($category->fresh()->parent_id);
    }

    public function test_a_category_cannot_be_moved_under_its_descendant(): void
    {
        $admin  = $this->admin();
        $root   = $this->category('ROOT');
        $middle = $this->category('MIDDLE', ['parent_id' => $root->id]);
        $leaf   = $this->category('LEAF', ['parent_id' => $middle->id]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/categories/{$root->id}", ['parent_id' => $leaf->id])
            ->assertStatus(422);

        $this->assertNull($root->fresh()->parent_id);
    }

    public function test_a_category_can_be_reparented_to_another_branch(): void
    {
        $admin = $this->admin();
        $alpha = $this->category('ALPHA');
        $beta  = $this->category('BETA');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/categories/{$beta->id}", ['parent_id' => $alpha->id])
            ->assertOk()
            ->assertJsonPath('data.parent_id', $alpha->id);

        $this->assertSame($alpha->id, $beta->fresh()->parent_id);
    }

    public function test_sort_order_is_appended_when_omitted(): void
    {
        $admin = $this->admin();
        $this->category('FIRST', ['sort_order' => 7]);
        $expected = (int) Category::max('sort_order') + 1;

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/categories', [
                'name'    => 'تصنيف جديد',
                'name_ar' => 'تصنيف جديد',
                'code'    => 'APPENDED',
            ])
            ->assertCreated();

        $this->assertSame($expected, $response->json('data.sort_order'));
    }

    public function test_delete_is_blocked_when_category_has_document_types(): void
    {
        $admin = $this->admin();
        $category = $this->category('WITH_TYPE');

        DocumentType::create([
            'category_id' => $category->id,
            'name'        => 'Type',
            'name_ar'     => 'نوع',
            'code'        => 'WITH_TYPE_T',
            'prefix'      => 'WTT',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/categories/{$category->id}")
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('categories', ['id' => $category->id, 'deleted_at' => null]);
    }

    public function test_active_only_filter_hides_inactive_categories(): void
    {
        $admin = $this->admin();
        $this->category('ACTIVE_CAT', ['is_active' => true]);
        $this->category('INACTIVE_CAT', ['is_active' => false]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/categories?active_only=1')
            ->assertOk();

        $codes = collect($response->json('data'))->pluck('code');

        $this->assertTrue($codes->contains('ACTIVE_CAT'));
        $this->assertFalse($codes->contains('INACTIVE_CAT'));
    }
}
