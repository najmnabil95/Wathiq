<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop default Laravel users table first and rebuild it
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username', 50)->unique();
            $table->string('email')->unique();
            $table->string('employee_number', 50)->unique()->nullable();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('password');
            $table->string('avatar')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('status', 20)->default('active'); // active, inactive, suspended
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('department_id');
            $table->index('employee_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
