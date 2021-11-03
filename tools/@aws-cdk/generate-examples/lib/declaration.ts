import * as reflect from 'jsii-reflect';

import { module } from './code';

export abstract class Declaration {
  public static sort(declarations: Declaration[]) {
    declarations.sort(Declaration.compare);
  }

  public static numberOfImports(declarations: Declaration[]): number {
    return declarations.filter((d) => d instanceof Import).length;
  }

  private static compare(lhs: Declaration, rhs: Declaration): number {
    if (lhs.sortKey[0] > rhs.sortKey[0]) {
      return 1;
    } else if (lhs.sortKey[0] < rhs.sortKey[0]) {
      return -1;
    } else {
      return lhs.sortKey[1].localeCompare(rhs.sortKey[1]);
    }
  }

  constructor(public readonly sortKey: [number, string]) {}

  public abstract equals(rhs: Declaration): boolean;
  public abstract render(): string;
}

/**
 * An Import statement that will get rendered at the top of the code snippet.
 */
export class Import extends Declaration {
  public constructor(public readonly type: reflect.Type) {
    super([0, module(type).moduleName]);
  }

  public equals(rhs: Declaration): boolean {
    return this.render() === rhs.render();
  }

  public render(): string {
    const { importName, moduleName } = module(this.type);
    return `import * as ${importName} from '${moduleName}';`;
  }
}

/**
 * A declared constant that will be rendered at the top of the code snippet after the imports.
 */
export class Assumption extends Declaration {
  public constructor(private readonly type: reflect.Type, private readonly name: string) {
    super([1, name]);
  }

  public equals(rhs: Declaration): boolean {
    return this.render() === rhs.render();
  }

  public render(): string {
    return `declare const ${this.name}: ${module(this.type).importName}.${this.type.name};`;
  }
}

/**
 * An assumption for an 'any' time. This will be treated the same as 'Assumption' but with a
 * different render result.
 */
export class AnyAssumption extends Declaration {
  public constructor(private readonly name: string) {
    super([1, name]);
  }

  public equals(rhs: Declaration): boolean {
    return this.render() === rhs.render();
  }

  public render(): string {
    return `declare const ${this.name}: any;`;
  }
}