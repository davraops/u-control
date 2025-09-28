const Account = require('../../models/Account');

describe('Account Model', () => {
  describe('Constructor', () => {
    it('should create account with default values', () => {
      const account = new Account({
        name: 'Test Account',
        type: 'checking',
        bank: 'Test Bank',
        balance: 1000
      });

      expect(account.name).toBe('Test Account');
      expect(account.type).toBe('checking');
      expect(account.bank).toBe('Test Bank');
      expect(account.balance).toBe(1000);
      expect(account.currency).toBe('COP');
      expect(account.tags).toEqual([]);
      expect(account.isActive).toBe(true);
      expect(account.id).toBeDefined();
      expect(account.createdAt).toBeDefined();
      expect(account.updatedAt).toBeDefined();
    });

    it('should create account with custom tags', () => {
      const account = new Account({
        name: 'Personal Account',
        type: 'savings',
        bank: 'Personal Bank',
        balance: 5000,
        tags: ['personal', 'ahorro']
      });

      expect(account.tags).toEqual(['personal', 'ahorro']);
    });

    it('should generate UUID for id if not provided', () => {
      const account1 = new Account({ name: 'Test 1', type: 'checking' });
      const account2 = new Account({ name: 'Test 2', type: 'checking' });

      expect(account1.id).toBeDefined();
      expect(account2.id).toBeDefined();
      expect(account1.id).not.toBe(account2.id);
    });
  });

  describe('Validation', () => {
    it('should validate required fields', () => {
      const account = new Account({});
      const validation = account.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El nombre de la cuenta es requerido');
      expect(validation.errors).toContain('El tipo de cuenta debe ser: checking, savings, investment, cash, o credit');
    });

    it('should validate account type', () => {
      const account = new Account({
        name: 'Test Account',
        type: 'invalid_type'
      });
      const validation = account.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El tipo de cuenta debe ser: checking, savings, investment, cash, o credit');
    });

    it('should validate bank requirement for non-cash accounts', () => {
      const account = new Account({
        name: 'Test Account',
        type: 'checking',
        bank: ''
      });
      const validation = account.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El banco es requerido para cuentas no efectivo');
    });

    it('should not require bank for cash accounts', () => {
      const account = new Account({
        name: 'Cash Account',
        type: 'cash',
        bank: ''
      });
      const validation = account.validate();

      expect(validation.isValid).toBe(true);
    });

    it('should validate negative balance', () => {
      const account = new Account({
        name: 'Test Account',
        type: 'checking',
        bank: 'Test Bank',
        balance: -100
      });
      const validation = account.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El saldo no puede ser negativo');
    });

    it('should validate currency format', () => {
      const account = new Account({
        name: 'Test Account',
        type: 'checking',
        bank: 'Test Bank',
        currency: 'INVALID'
      });
      const validation = account.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('La moneda debe ser un código de 3 letras (ej: COP, USD)');
    });

    it('should pass validation with valid data', () => {
      const account = new Account({
        name: 'Valid Account',
        type: 'checking',
        bank: 'Valid Bank',
        balance: 1000,
        currency: 'USD',
        tags: ['personal']
      });
      const validation = account.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation with tags', () => {
      const account = new Account({
        name: 'Test Account',
        type: 'checking',
        bank: 'Test Bank',
        balance: 1000,
        tags: ['personal', 'empresa']
      });

      const json = account.toJSON();

      expect(json).toEqual({
        id: account.id,
        name: 'Test Account',
        type: 'checking',
        bank: 'Test Bank',
        balance: 1000,
        currency: 'COP',
        tags: ['personal', 'empresa'],
        isActive: true,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      });
    });
  });

  describe('Static Methods', () => {
    describe('getAccountTypes', () => {
      it('should return available account types', () => {
        const types = Account.getAccountTypes();

        expect(types).toHaveLength(5);
        expect(types).toEqual([
          { value: 'checking', label: 'Cuenta Corriente', icon: '🏦' },
          { value: 'savings', label: 'Cuenta de Ahorros', icon: '💰' },
          { value: 'investment', label: 'Inversión', icon: '📈' },
          { value: 'cash', label: 'Efectivo', icon: '💵' },
          { value: 'credit', label: 'Tarjeta de Crédito', icon: '💳' }
        ]);
      });
    });

    describe('getCurrencies', () => {
      it('should return available currencies', () => {
        const currencies = Account.getCurrencies();

        expect(currencies).toHaveLength(5);
        expect(currencies[0]).toEqual({
          value: 'COP',
          label: 'Peso Colombiano',
          symbol: '$'
        });
      });
    });

    describe('getAvailableTags', () => {
      it('should return available tags', () => {
        const tags = Account.getAvailableTags();

        expect(tags).toHaveLength(6);
        expect(tags).toEqual([
          { value: 'personal', label: 'Personal', color: 'primary', icon: '👤' },
          { value: 'empresa', label: 'Empresa', color: 'secondary', icon: '🏢' },
          { value: 'inversion', label: 'Inversión', color: 'success', icon: '📈' },
          { value: 'ahorro', label: 'Ahorro', color: 'info', icon: '💰' },
          { value: 'emergencia', label: 'Emergencia', color: 'warning', icon: '🚨' },
          { value: 'gastos', label: 'Gastos', color: 'error', icon: '💸' }
        ]);
      });
    });
  });
});

