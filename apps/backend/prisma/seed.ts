import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начало заполнения базы данных...');

  // Создание ролей
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        description: 'Обычный пользователь',
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Администратор',
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'moderator' },
      update: {},
      create: {
        name: 'moderator',
        description: 'Модератор',
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'analyst' },
      update: {},
      create: {
        name: 'analyst',
        description: 'Аналитик',
        isSystem: true,
      },
    }),
  ]);

  console.log('✅ Роли созданы');

  // Создание разрешений
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { name: 'market:create' },
      update: {},
      create: {
        name: 'market:create',
        description: 'Создание рынков',
        resource: 'market',
        action: 'create',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'market:edit' },
      update: {},
      create: {
        name: 'market:edit',
        description: 'Редактирование рынков',
        resource: 'market',
        action: 'edit',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'market:delete' },
      update: {},
      create: {
        name: 'market:delete',
        description: 'Удаление рынков',
        resource: 'market',
        action: 'delete',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'market:resolve' },
      update: {},
      create: {
        name: 'market:resolve',
        description: 'Разрешение рынков',
        resource: 'market',
        action: 'resolve',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'user:view' },
      update: {},
      create: {
        name: 'user:view',
        description: 'Просмотр пользователей',
        resource: 'user',
        action: 'view',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'user:edit' },
      update: {},
      create: {
        name: 'user:edit',
        description: 'Редактирование пользователей',
        resource: 'user',
        action: 'edit',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'user:delete' },
      update: {},
      create: {
        name: 'user:delete',
        description: 'Удаление пользователей',
        resource: 'user',
        action: 'delete',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'user:ban' },
      update: {},
      create: {
        name: 'user:ban',
        description: 'Блокировка пользователей',
        resource: 'user',
        action: 'ban',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'admin:view' },
      update: {},
      create: {
        name: 'admin:view',
        description: 'Просмотр админ панели',
        resource: 'admin',
        action: 'view',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'admin:edit' },
      update: {},
      create: {
        name: 'admin:edit',
        description: 'Редактирование настроек',
        resource: 'admin',
        action: 'edit',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'admin:audit' },
      update: {},
      create: {
        name: 'admin:audit',
        description: 'Просмотр логов аудита',
        resource: 'admin',
        action: 'audit',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'analytics:view' },
      update: {},
      create: {
        name: 'analytics:view',
        description: 'Просмотр аналитики',
        resource: 'analytics',
        action: 'view',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'analytics:export' },
      update: {},
      create: {
        name: 'analytics:export',
        description: 'Экспорт аналитики',
        resource: 'analytics',
        action: 'export',
      },
    }),
  ]);

  console.log('✅ Разрешения созданы');

  // Назначение всех разрешений админу
  const adminRole = roles.find((r) => r.name === 'admin');
  if (adminRole) {
    await Promise.all(
      permissions.map((permission) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        }),
      ),
    );
    console.log('✅ Разрешения назначены админу');
  }

  // Создание категорий
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'politics' },
      update: {},
      create: {
        name: 'Политика',
        slug: 'politics',
        description: 'Политические события и выборы',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sports' },
      update: {},
      create: {
        name: 'Спорт',
        slug: 'sports',
        description: 'Спортивные события',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'crypto' },
      update: {},
      create: {
        name: 'Криптовалюты',
        slug: 'crypto',
        description: 'Криптовалюты и блокчейн',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'economics' },
      update: {},
      create: {
        name: 'Экономика',
        slug: 'economics',
        description: 'Экономические события',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'technology' },
      update: {},
      create: {
        name: 'Технологии',
        slug: 'technology',
        description: 'Технологические новости',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'entertainment' },
      update: {},
      create: {
        name: 'Развлечения',
        slug: 'entertainment',
        description: 'Развлечения и культура',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'other' },
      update: {},
      create: {
        name: 'Другое',
        slug: 'other',
        description: 'Прочие события',
      },
    }),
  ]);

  console.log('✅ Категории созданы');
  console.log('🎉 Заполнение базы данных завершено!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
