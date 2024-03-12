import BTree from 'sorted-btree';

/**
 * Maximum individual resizes (not counting the runs).
 */
const MAX_ALLOWED_RESIZE = 5e6;

/**
 * The record stored by the {@link DataMap}.
 */
export type DataRecord<DataType> = {
  /**
   * The data.
   */
  data: DataType;
  /**
   * The last index covered by this record.
   */
  endIndex?: number;
  /**
   * Whether this record was set by the grid automatically.  If false
   * (or undefined), it means that the data was set by the user, so it
   * can only be updated by the user.
   */
  auto?: boolean;
};

/**
 * This is returned by {@link DataMap.getRecord} as result.
 */
export type DataRecordWithStartIndex<DataType> = {
  /**
   * This is set by the {@link DataMap.getRecord} to indicate that the
   * returned data is included as a range and is not the owner of the key.
   */
  startIndex?: number;
} & DataRecord<DataType>;

/**
 * This class helps store data set for a range of items (rows, colums and
 * possibly cells).
 */
export class DataMap<DataType> {
  private _records = new BTree<number, DataRecord<DataType>>();

  /**
   * The records in raw form.
   */
  get records() {
    return this._records;
  }

  /**
   * The total length of all the stored records.
   *
   * Note that this doesn't include the runs, but the object count.
   */
  get length() {
    return this._records.length;
  }

  /**
   * Remove all the records.
   */
  clear = () => {
    this._records.clear();
  };

  /**
   * Delete a record or range of records.
   * @param key To start deleting from.
   * @param auto Whether to override user-set records (i.e., if this is done by the user).
   * @param endIndex The last index to delete (or undefined to only delete {@link key}}).
   * @returns True if there were no records to delete, or the deletion was successful.
   */
  delete = (key: number, auto?: boolean, endIndex?: number) => {
    const currentRecord = this.getRecord(key);
    if (currentRecord !== undefined) {
      // Do not let changing the data, if the previous data was not
      // automatically set by the grid.
      if (auto && !currentRecord.auto) return false;

      // If the `endIndex` is bigger than the current `endIndex`, create a
      // copy of the data and put it to the end of the latter.
      if (currentRecord.endIndex > (endIndex ?? key)) {
        const newKey = (endIndex ?? key) + 1;
        this._records.set(newKey, { ...currentRecord });
      }

      // If the existing data starts from a lower index, limit its end index
      // to the start of the current key.
      if (currentRecord.startIndex < key) {
        this._records.set(currentRecord.startIndex, currentRecord);
        currentRecord.endIndex = key - 1;
        delete currentRecord.startIndex;
      }
    }

    if (endIndex <= key) endIndex = undefined;
    if (endIndex > key) {
      // Separate and clear old indexes.
      this._separateKey(endIndex + 1);
      this._records.deleteRange(key, endIndex, true);
    }

    return true;
  };

  /**
   * Finds and returns the data stored for the given key.
   * @param {number} key To get the data for.
   * @returns {DataType | undefined} The data or undefined if there is not matching key.
   * @see getRecord
   */
  getData = (key: number): DataType | undefined => {
    return this.getRecord(key)?.data;
  };

  /**
   * Finds and returns the data stored for the given key, or returns the default
   * value provided if there is no matching data.
   * @param {number} key To get the data for.
   * @param {DataType} [defaultValue] To return if there is no matching key.
   * @returns {DataType | undefined} The data or the default value provided.
   */
  getDataOrDefault = (
    key: number,
    defaultValue?: DataType,
  ): DataType | undefined => {
    const value = this.getData(key);
    if (value !== undefined) return value;
    return defaultValue;
  };

  /**
   * Finds and returns the record for the given key.
   * @param {number} key To match.
   * @returns {DataRecordWithStartIndex<DataType> | undefined} The record or undefined if there is no matching record for the given key.
   */
  getRecord = (key: number): DataRecordWithStartIndex<DataType> | undefined => {
    const record = this._records.getPairOrNextLower(key);
    if (!record) return undefined;
    if (record[0] === key) return record[1];

    if (record[1].endIndex >= key) {
      const copyRecord = {
        ...record[1],
      } as DataRecordWithStartIndex<DataType>;
      copyRecord.startIndex = record[0];
      return copyRecord;
    }
  };

  /**
   * Sets the data for the given key.
   *
   * If {@link endIndex} is provided, the same data will be served to the keys
   * between {@link key} and {@link endIndex} when the data is requested
   * using one of the getter methods.
   *
   * Note that ranging data set with an end index are not saved multiple times
   * to use memory more efficiently.
   *
   * Also note that setting {@link auto} to false means the data is set by the
   * user, so another attempt to set the data with it set to `true` will not be
   * allowed unless the data is removed.
   *
   * Finally, this removes and separates ranging data when needed, so you don't
   * need to worry about manual cleanup.
   * @param {number} key To set the data for.
   * @param {number} data To set.
   * @param {boolean} [auto] Whether this data is set automatically by the grid.
   * @param {number} [endIndex] The last index that the data will be set for.
   * @returns {boolean} True if the data is successfully set, or false if the data protected, as it was set by the user.
   */
  setData = (
    key: number,
    data: DataType,
    auto?: boolean,
    endIndex?: number,
  ): boolean => {
    if (this.delete(key, auto, endIndex)) {
      this._records.set(key, { data, auto, endIndex });
      return true;
    }
    return false;
  };

  reorder = (
    afterViewIndex: number,
    startIndex: number,
    endIndex: number,
    skippedIndexes?: number[],
  ) => {
    if (this.length >= MAX_ALLOWED_RESIZE) return false;

    const total = 1 + (endIndex ?? startIndex) - startIndex;
    if (total < 1 || afterViewIndex === startIndex) return false;

    const movingRecords = [] as [number, DataRecord<DataType>][];
    endIndex = endIndex ?? startIndex;

    // Separate the start index early.
    this._separateKey(startIndex);

    // Load and separate the data that is being moved.
    this._records
      .getRange(startIndex, endIndex, true)
      .forEach((pair, _, __) => {
        const [currentIndex, originalRecord] = pair;
        const record = { ...originalRecord };

        // If the record extends beyond the end index, separate it by creating
        // a new record for it.
        if (record.endIndex > endIndex) {
          this._records.set(endIndex + 1, { ...originalRecord });
        }
        // Make it so that the original data no longer includes the moved range.
        if (currentIndex < startIndex) {
          originalRecord.endIndex = startIndex - 1;
        }
        // Delete the moved data.
        this._records.delete(currentIndex);
        // Make sure the data only includes the moved range.
        if (record.endIndex > endIndex) {
          record.endIndex = endIndex;
        }

        movingRecords.push([Math.max(currentIndex, startIndex), record]);
      });

    const isAscending = afterViewIndex > startIndex;
    const isAddition = !isAscending;
    // We don't touch the data that the is behind the target or start index,
    // that is why you are seeing a bunch of `+1`s or `-1`s.
    const startPos = isAscending ? endIndex + 1 : afterViewIndex + 1;
    const endPos = isAscending ? afterViewIndex : startIndex - 1;

    // Separate the record containing the target index if it's a range.  We are
    // using `afterViewIndex + 1` always because the view index always comes
    // with -1 offset hence the name.
    this._separateKey(afterViewIndex + 1);

    // Move the other data.  Note that this was originally replacing items
    // in-place without allocating new memory.  The problem is we are now using
    // a btree implementation, and it returns undefined for the record when we
    // do so.
    const reorderingData = this._records.getRange(startPos, endPos, true);
    for (let i = 0; i < reorderingData.length; i++) {
      // We loop in reverse order when the target index is bigger than start
      // index so that we can make room for the moved data without overwriting
      // anything.
      const [currentIndex, record] =
        reorderingData[isAscending ? i : reorderingData.length - 1 - i];

      if (record.endIndex !== undefined) {
        if (isAddition) {
          record.endIndex += total;
        } else {
          record.endIndex -= total;
        }
      }
      this._records.delete(currentIndex);
      this._records.set(
        isAddition ? currentIndex + total : currentIndex - total,
        record,
      );
    }

    // Finally, apply the moved data back.  When `isAddition` is false, we are
    // removing the indexes with `(endIndex - startIndex)` so that we can write
    // over the space that we have prepared, and there isn't +1 for that because
    // we are targeting the left of the `afterViewIndex`.
    const diff = isAddition
      ? afterViewIndex - startIndex + 1
      : afterViewIndex - (endIndex - startIndex) - startIndex;
    for (const [key, record] of movingRecords) {
      this._records.set(key + diff, record);
      if (record.endIndex !== undefined) record.endIndex += diff;
    }
  };

  /**
   * Separates the key if the record for it is a ranging one with `endIndex`.
   * @param key To separate.
   */
  private _separateKey = (key: number) => {
    const record = this.getRecord(key);
    if (record?.startIndex === undefined || record.startIndex === key) return;

    this._records.set(record.startIndex, record);
    delete record.startIndex;

    // Now that we've gotten rid of `startIndex`, we can get a copy and save it.
    this._records.set(key, { ...record });

    // Limit the end index of the original record.
    record.endIndex = key - 1;
  };
}
