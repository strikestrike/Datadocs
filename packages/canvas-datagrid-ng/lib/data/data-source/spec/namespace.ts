import type { CellStyleDeclaration } from '../../../types/cell';

export type NameType = 'workbook' | 'range' | 'table' | 'formula';

/**
 * The function to use when looping over components with
 * {@link NamespaceController.forEachComponent}.
 */
export type ComponentCallback = (
  name: string,
  type: NameType,
  item: any,
  controller: NamespaceController,
) => boolean | undefined;

/**
 * The result of {@link NamespaceController.getComponent}.
 */
export type ComponentDescriptor = {
  /**
   * Name of the component.
   */
  name: string;
  /**
   * Type of the component.  Controllers will identify as 'controller'.
   */
  type: NameType | 'controller';
  /**
   * The component instance.
   */
  item: any;
  /**
   * The {@link NamespaceController} that contains the component.
   */
  controller: NamespaceController;
};

/**
 * Used to produce a name for the given name type.
 * @see NamespaceController.nameFactoryCallback
 */
export type NameFactoryCallback = (
  forType: NameType,
  nextNumber: number,
) => string;

/**
 * A self-contained component provider for single-level components such as
 * tables, named ranges, and other types of items that use the names and
 * namespaces.
 */
export interface ComponentProvider {
  /**
   * Traverse all the items that is on this provider.
   *
   * Note that this will be single-level components, meaning they are considered
   * a part of the controller that this provider is a part of.
   *
   * Returning `false` from the callback will break the loop.
   * @param controller That contains the provider.
   * @param callback To call on each item.
   */
  forEach(controller: NamespaceController, callback: ComponentCallback): any;
}

/**
 * A namespace controller is a provider of namespaces and organization, team,
 * user, or workbook level defaults such as the cell styles.
 *
 * Namespace controllers are responsible for handling named items such as
 * ranges, formulae, and tables (including pivot tables).
 *
 * To assign a parent controller to a controller, call
 * {@link NamespaceController["attachChild"]} on the parent controller, which will
 * also assign the child controller a member on the parent controller.
 */
export interface NamespaceController {
  /**
   * The factory that produces the names for the components when requested with
   * {@link nextName}.
   *
   * This is used for internalization only, e.g., when the display language is
   * set to English, and a new table name is requested, the result will be
   * `Table1` or something similar. The same result will be `Tablo1` for
   * Turkish.
   */
  nameFactoryCallback: NameFactoryCallback;

  /**
   * The parent controller (if one exists) providing defaults.
   *
   * When provided, values coming from the parent controller (and possibly its
   * parent) will be replaced by this controller if they are already present.
   */
  getParent(): NamespaceController | undefined;

  /**
   * Get the child controllers that is connected to this controller.
   */
  getChildren(): NamespaceController[];

  /**
   * Get the component providers for this controller.
   * @see ComponentProvider
   */
  getComponentProviders(): readonly ComponentProvider[];

  /**
   * Attach a child controller to this controller, and attach this controller as
   * the parent controller to it.
   * @param childController To attach to this controller.
   * @return True if the child controller was attached successfully, or false if
   * it was already so.
   */
  attachChild(childController: NamespaceController): boolean;

  /**
   * Detach a child controller.
   * @param childController To detach
   * @returns True if the controller was attached, and is now detached.
   */
  detachChild(childController: NamespaceController): boolean;

  /**
   * Attach a controller as the parent controller to this controller.
   *
   * Because both the parent and child controller need to be assigned and
   * unassigned at the same time, this is a private method that needs to be
   * implemented internally and should only be called in {@link attachChild}.
   * @param parentController To assign.
   */
  _attachParent(parentController: NamespaceController): any;

  /**
   * Detach the parent controller from this controller.
   */
  _detachParent(): any;

  /**
   * Name of this namespace controller.
   *
   * When not provided, the controller will be considered intermediate, and it
   * will use the namespace of the parent controller, or no namespace if not
   * parent controller is set.
   *
   * Example: Workbook.
   */
  getName(): string | undefined;

  /**
   * Namespace of the current controller.
   *
   * Note that this includes the name of this controller as well, and is a
   * combination of the names of the parent controllers and the name of this
   * controller.
   *
   * The root controller will not report a name, since there can only be one
   * root controller.
   *
   * Example: Com.Datadocs.Workbook
   */
  getNamespace(): string | undefined;

  /**
   * The default style that is going to be applied to the cells.
   *
   * This is a combined value coming from this and the parent controller where
   * existing properties are replaced by the child controllers.
   * @return The default cell style.
   */
  getDefaultCellStyle(): Partial<CellStyleDeclaration> | undefined;

  /**
   * Finds and returns a component that uses the name system and with a matching
   * namespace and name.
   *
   * To start searching from the root controller, pass `searchOnRoot` as
   * true.
   * Example: Com.Datadocs.Workbook1.Table1
   *
   * If the last name is pointing to the name of a controller, it will be
   * returned as the result.
   * @param name Component name to find.
   * @param searchOnRoot Search in the root controller.
   * @return The result or undefined if nothing was found.
   * @see ComponentDescriptor
   */
  getComponent(
    name: string,
    searchOnRoot: boolean,
  ): ComponentDescriptor | undefined;

  /**
   * Check if the given name is being used by any components, or child
   * controllers as their names.
   *
   * This doesn't do recursive check, meaning only the names of the child
   * controllers are checked (but not their components and grandchildren), and
   * the components.
   * @param name To check.
   * @return True if the name is usable, or false if the name is taken.
   */
  checkName(name: string): boolean;

  /**
   * Check whether this namespace controller contains the given name locally.
   *
   * This is different than how {@link getComponent} and
   * {@link forEachComponent} work, since this does not respect the
   * namespaces, meaning it only finds out whether it has a component matching
   * the given name.
   * @param name To check.
   */
  contains(name: string): boolean;

  /**
   * Loop over the components that exist on this controller, and also
   * preferrably on the components of the child controllers.
   *
   * When in recursive mode, the controller inside the child controlers are also
   * included.
   * @param recursive Include the components from the child controllers.
   * @param callback To call for each item (return true to get the next item).
   */
  forEachComponent(recursive: boolean, callback: ComponentCallback);

  /**
   * Get the next name available name for the given type.
   *
   * If available {@link nameFactoryCallback}, this will produce the name and
   * check if that name is actually available. If not, English will be used.
   * @param forType To get the number for (e.g., table).
   * @returns The next available name.
   */
  nextName(forType: NameType): string;
}
