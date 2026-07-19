import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Scope boundaries (AD-1): ningún Remote depende de otro Remote.
            // Este eje es el que garantiza el aislamiento entre dominios -- las
            // reglas de "type" de abajo permiten ui->ui y data-access->data-access,
            // pero solo llegan a destino si el scope tambien lo permite (shared).
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:shell',
              onlyDependOnLibsWithTags: ['scope:shell', 'scope:shared'],
            },
            {
              sourceTag: 'scope:catalogo',
              onlyDependOnLibsWithTags: ['scope:catalogo', 'scope:shared'],
            },
            {
              sourceTag: 'scope:carrito',
              onlyDependOnLibsWithTags: ['scope:carrito', 'scope:shared'],
            },
            {
              sourceTag: 'scope:perfil',
              onlyDependOnLibsWithTags: ['scope:perfil', 'scope:shared'],
            },
            // Type boundaries (AD-2): dirección de dependencia feature -> {ui,data-access,util}.
            // ui/data-access tambien pueden depender de su propio tipo (para llegar a
            // scope:shared, ej. catalogo-ui -> shared-ui) -- el eje de scope de arriba
            // es el que impide que esto cruce a otro dominio (catalogo-ui -> carrito-ui).
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:util'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:util', 'type:ui'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:util', 'type:data-access'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: [],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
