import type { NamespaceController } from '../../types';
import type {
  ComponentCallback,
  ComponentProvider,
  ComponentDescriptor,
  NameFactoryCallback,
  NameType,
} from '../data-source/spec/namespace';

export class DefaultNamespaceController implements NamespaceController {
  private readonly autoIncrement: Partial<Record<NameType, number>> = {};

  private readonly children: NamespaceController[] = [];

  constructor(
    private readonly componentProviders: ComponentProvider[] = [],
    private name?: string,
    private parentController?: NamespaceController,
  ) {
    if (parentController) {
      parentController.attachChild(this);
    }
  }

  defaultNameFactoryCallback: NameFactoryCallback = (
    forType: NameType,
    nextNumber: number,
  ) => {
    switch (forType) {
      case 'workbook':
        return `Workbook ${nextNumber}`;
      case 'table':
        return `Table ${nextNumber}`;
      case 'range':
        return `Range ${nextNumber}`;
      case 'formula':
        return `Formula ${nextNumber}`;
      default:
        return `Unknown ${nextNumber}`;
    }
  };

  nameFactoryCallback: NameFactoryCallback = undefined;

  getParent = () => this.parentController;

  getChildren = () => this.children;

  getComponentProviders = () => this.componentProviders;

  attachChild = (childController: NamespaceController) => {
    if (this.children.indexOf(childController) !== -1) return false;
    if (childController.getParent()) {
      // Detach from the existing one that is not this controller.
      childController.getParent().detachChild(childController);
    }

    this.children.push(childController);
    childController._attachParent(this);

    return true;
  };

  detachChild = (childController: NamespaceController) => {
    const index = this.children.indexOf(childController);
    if (index === -1) return false;

    this.children.splice(index, 1);
    childController._detachParent();
  };

  _detachParent = () => {
    this.parentController = undefined;
  };

  _attachParent = (parentController: NamespaceController) => {
    this.parentController = parentController;
  };

  getName = () => this.name;

  getNamespace = () => {
    if (!this.getParent()) return '';
    const parentNs = this.getParent()?.getNamespace();

    // If the current controller has no name, consider it an intermediate
    // controller that uses the parent namespace, and just return here.
    if (!this.getName()) return parentNs;

    return (parentNs ? parentNs + '.' : '') + this.getName();
  };

  getDefaultCellStyle = () => undefined;

  getComponent = (name: string, searchOnRoot: boolean): ComponentDescriptor => {
    let controller = this as NamespaceController;
    if (searchOnRoot) {
      let parent = this.getParent();
      while (parent) {
        controller = parent;
        parent = parent.getParent();
      }
    }

    const lookup = name.split('.');
    if (lookup.length === 0 || lookup[0].length === 0) return;
    const targetName = lookup[0];
    const innerNs = lookup.length > 1 ? lookup.slice(1) : [];

    for (const child of controller.getChildren()) {
      if (!child.getName()) {
        // If the child controller has no name, consider it as the same level as
        // this controller and just hand out the full namespace instead of the
        // trimmed one.
        const result = child.getComponent(name, false);
        if (result) return result;
      } else if (child.getName() === targetName) {
        // If there are remaining names, search in the child controller, or
        // return the child controller if there are no remaining names.
        if (innerNs.length > 0) {
          return child.getComponent(innerNs.join('.'), false);
        } else {
          return {
            name: child.getName(),
            type: 'controller',
            item: child,
            controller: child.getParent(),
          };
        }
      }
    }

    let component: ComponentDescriptor | undefined;
    for (const provider of this.getComponentProviders()) {
      provider.forEach(this, (componentName, type, item, controller) => {
        if (name === componentName) {
          component = {
            name: componentName,
            type,
            item,
            controller,
          };
          return false;
        }
        return true;
      });
      if (component) {
        return component;
      }
    }
  };

  checkName = (name: string) => {
    if (!this.getName() && this.getParent()) {
      // If the current controller has no name, it means it is an intermediate
      // controller and is using the parent controller as the as the real
      // namespace.
      return this.getParent().checkName(name);
    }

    name = name.trim();
    if (name.length <= 0) return false;

    const sensitivity = { sensitivity: 'accent' };
    let contains = false;
    this.forEachComponent(false, (other) => {
      if (name.localeCompare(other, undefined, sensitivity) === 0) {
        contains = true;
        return false;
      }
      return true;
    });
    return !contains;
  };

  contains = (componentName: string) => {
    let contains = false;
    for (const provider of this.getComponentProviders()) {
      provider.forEach(this, (name) => {
        if (componentName === name) {
          contains = true;
          return false;
        }
        return true;
      });
      if (contains) {
        return true;
      }
    }
    return false;
  };

  forEachComponent = (recursive: boolean, callback: ComponentCallback) => {
    let finished = false;
    const localCallback = (name, type, item, controller) => {
      if (callback(name, type, item, controller)) return true;
      finished = true;
      return false;
    };

    for (const child of this.getChildren()) {
      // Allow if recursive or the child is using this parent namespace.
      if (!recursive && child.getName()) continue;

      child.forEachComponent(recursive, localCallback);
      if (finished) return;
    }

    for (const provider of this.getComponentProviders()) {
      provider.forEach(this, localCallback);
      if (finished) return;
    }
  };

  nextName = (forType: NameType): string => {
    if (!this.getName() && this.getParent()) {
      // If the current controlller has no name, it means it is an intermediate
      // namespace and is using the parent namespace as the as the real
      // namespace.
      return this.getParent().nextName(forType);
    }

    let factory: NameFactoryCallback | undefined;
    let controller = this as NamespaceController;
    while (controller && !factory) {
      factory = controller.nameFactoryCallback;
      controller = controller.getParent();
    }
    if (!factory) factory = this.defaultNameFactoryCallback;

    if (!this.autoIncrement[forType]) {
      this.autoIncrement[forType] = 0;
    }
    let name: string;
    do {
      name = factory(forType, ++this.autoIncrement[forType]);
    } while (!this.checkName(name));
    return name;
  };
}
