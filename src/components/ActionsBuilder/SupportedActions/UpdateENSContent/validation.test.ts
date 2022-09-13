import { isEnsName } from './validation';

describe('isEnsName validation', () => {
  describe('should return true', () => {
    it('should be a correct ENS name for a top level domain', () => {
      const name = 'name.eth';
      const { isValid } = isEnsName(name);
      expect(isValid).toEqual(true);
    });

    it('should be a correct ENS name for a subdomain', () => {
      const name = 'subdomain.name.eth';
      const { isValid } = isEnsName(name);
      expect(isValid).toEqual(true);
    });
  });

  describe('should catch validation errors', () => {
    it(`should return an error if there's a subdomain with no letters on it (two dots together)`, () => {
      const name = 'test..eth';
      const { isValid, validationError } = isEnsName(name);
      expect(isValid).toEqual(false);
      expect(validationError).toBe('Domain names have invalid length');
    });

    it(`should return an error if the domain starts with a dot`, () => {
      const name = '.test.eth';
      const { isValid, validationError } = isEnsName(name);
      expect(isValid).toEqual(false);
      expect(validationError).toBe('Domain names have invalid length');
    });

    it(`should return an error if the domain has spaces`, () => {
      const name = 'sub domain.test.eth';
      const { isValid, validationError } = isEnsName(name);
      expect(isValid).toEqual(false);
      expect(validationError).toBe('Domain name cannot include spaces');
    });

    it(`should return an error if the domain is more than two levels deep`, () => {
      const name = 'subsubdomain.subdomain.test.eth';
      const { isValid, validationError } = isEnsName(name);
      expect(isValid).toEqual(false);
      expect(validationError).toBe(
        'Domain cannot be more than three levels deep (subdomain.domain.eth)'
      );
    });
  });
});
