// --- ▼▼▼ TitheAPI.gs - 奉獻計算 API ▼▼▼ ---

/**
 * 建立奉獻計算任務
 * API: createTitheTask
 * 權限: finance_staff 或 treasurer
 *
 * @param {object} request - 請求物件 {taskName, calculationTimestamp, treasurerUid, financeStaffUid}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function createTitheTask(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入
    const validation = validateInput(request, {
      taskName: { required: true, type: 'string' },
      calculationTimestamp: { required: true, type: 'string' },
      treasurerUid: { required: true, type: 'string' },
      financeStaffUid: { required: true, type: 'string' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    // 取得使用者資訊
    const userDAO = new UserDAO();
    const treasurer = userDAO.findById(request.treasurerUid);
    const financeStaff = userDAO.findById(request.financeStaffUid);

    if (!treasurer) {
      throw new Error('NOT_FOUND|找不到會計');
    }

    if (!financeStaff) {
      throw new Error('NOT_FOUND|找不到財務人員');
    }

    // 檢查是否已存在相同任務
    const titheDAO = new TitheDAO();
    if (titheDAO.taskExists(request.taskName, request.calculationTimestamp)) {
      throw new Error('DUPLICATE|已存在相同名稱和時間的任務');
    }

    // 建立任務
    const taskData = {
      taskName: request.taskName,
      calculationTimestamp: request.calculationTimestamp,
      treasurerUid: request.treasurerUid,
      treasurerName: treasurer.displayName,
      financeStaffUid: request.financeStaffUid,
      financeStaffName: financeStaff.displayName
    };

    const task = titheDAO.create(taskData);

    // 記錄活動
    logInfo('建立奉獻任務', {
      taskId: task.id,
      taskName: task.taskName,
      user: user.email
    });

    return createSuccessResponse(task, '奉獻任務已建立');

  } catch (error) {
    logError('createTitheTask', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得奉獻任務列表
 * API: getTitheTasks
 * 權限: finance_staff 或 treasurer
 *
 * @param {object} request - 請求物件 {status}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getTitheTasks(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    const titheDAO = new TitheDAO();
    let tasks;

    // 根據狀態篩選
    if (request.status === TITHE_STATUS.IN_PROGRESS) {
      tasks = titheDAO.getInProgressTasks();
    } else if (request.status === TITHE_STATUS.COMPLETED) {
      tasks = titheDAO.getCompletedTasks();
    } else {
      // 取得所有任務
      tasks = titheDAO.findAll();
    }

    // 依建立時間降序排序
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return createSuccessResponse(tasks);

  } catch (error) {
    logError('getTitheTasks', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得單一奉獻任務
 * API: getTitheTask
 * 權限: finance_staff 或 treasurer
 *
 * @param {object} request - 請求物件 {id}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getTitheTask(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入
    const validation = validateInput(request, {
      id: { required: true, type: 'string' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    const titheDAO = new TitheDAO();
    const task = titheDAO.findById(request.id);

    if (!task) {
      throw new Error('NOT_FOUND|找不到奉獻任務');
    }

    return createSuccessResponse(task);

  } catch (error) {
    logError('getTitheTask', error);
    return createErrorResponse(error);
  }
}

/**
 * 新增奉獻記錄
 * API: addDedication
 * 權限: finance_staff 或 treasurer（且是該任務的負責人）
 *
 * @param {object} request - 請求物件 {titheTaskId, donor, category, amount, date, notes}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function addDedication(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入
    const validation = validateInput(request, {
      titheTaskId: { required: true, type: 'string' },
      donor: { required: true, type: 'string' },
      category: { required: true, type: 'string' },
      amount: { required: true, type: 'number' },
      date: { required: true, type: 'string' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    // 檢查任務是否存在
    const titheDAO = new TitheDAO();
    const task = titheDAO.findById(request.titheTaskId);

    if (!task) {
      throw new Error('NOT_FOUND|找不到奉獻任務');
    }

    // 檢查任務狀態
    if (task.status === TITHE_STATUS.COMPLETED) {
      throw new Error('INVALID_OPERATION|任務已完成，無法新增記錄');
    }

    // 檢查使用者是否為該任務的負責人
    const isTaskOwner =
      task.treasurerUid === user.id ||
      task.financeStaffUid === user.id ||
      user.roles.includes(USER_ROLES.ADMIN);

    if (!isTaskOwner) {
      throw new Error('PERMISSION_DENIED|您不是此任務的負責人');
    }

    // 建立奉獻記錄
    const dedicationDAO = new DedicationDAO();
    const dedicationData = {
      titheTaskId: request.titheTaskId,
      '献金者': request.donor,
      '奉獻類別': request.category,
      '金額': request.amount,
      '入帳日期': request.date,
      '備註': request.notes || ''
    };

    // 驗證奉獻記錄
    const dedicationValidation = dedicationDAO.validate(dedicationData);
    if (!dedicationValidation.valid) {
      throw new Error('INVALID_INPUT|' + dedicationValidation.errors.join(', '));
    }

    const dedication = dedicationDAO.create(dedicationData);

    // 記錄活動
    logInfo('新增奉獻記錄', {
      taskId: request.titheTaskId,
      dedicationId: dedication.id,
      user: user.email
    });

    return createSuccessResponse(dedication, '奉獻記錄已新增');

  } catch (error) {
    logError('addDedication', error);
    return createErrorResponse(error);
  }
}

/**
 * 批次新增奉獻記錄
 * API: batchAddDedications
 * 權限: finance_staff 或 treasurer（且是該任務的負責人）
 *
 * @param {object} request - 請求物件 {titheTaskId, dedications: Array}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function batchAddDedications(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入
    const validation = validateInput(request, {
      titheTaskId: { required: true, type: 'string' },
      dedications: { required: true, type: 'array' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    // 檢查任務是否存在
    const titheDAO = new TitheDAO();
    const task = titheDAO.findById(request.titheTaskId);

    if (!task) {
      throw new Error('NOT_FOUND|找不到奉獻任務');
    }

    // 檢查任務狀態
    if (task.status === TITHE_STATUS.COMPLETED) {
      throw new Error('INVALID_OPERATION|任務已完成，無法新增記錄');
    }

    // 檢查使用者是否為該任務的負責人
    const isTaskOwner =
      task.treasurerUid === user.id ||
      task.financeStaffUid === user.id ||
      user.roles.includes(USER_ROLES.ADMIN);

    if (!isTaskOwner) {
      throw new Error('PERMISSION_DENIED|您不是此任務的負責人');
    }

    // 批次建立奉獻記錄
    const dedicationDAO = new DedicationDAO();
    const createdDedications = dedicationDAO.batchCreate(request.titheTaskId, request.dedications);

    // 記錄活動
    logInfo('批次新增奉獻記錄', {
      taskId: request.titheTaskId,
      count: createdDedications.length,
      user: user.email
    });

    return createSuccessResponse(
      { dedications: createdDedications, count: createdDedications.length },
      `已新增 ${createdDedications.length} 筆奉獻記錄`
    );

  } catch (error) {
    logError('batchAddDedications', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得奉獻記錄列表
 * API: getDedications
 * 權限: finance_staff 或 treasurer
 *
 * @param {object} request - 請求物件 {titheTaskId}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getDedications(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入
    const validation = validateInput(request, {
      titheTaskId: { required: true, type: 'string' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    const dedicationDAO = new DedicationDAO();
    const dedications = dedicationDAO.getByTaskId(request.titheTaskId);

    // 依建立時間降序排序
    dedications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return createSuccessResponse(dedications);

  } catch (error) {
    logError('getDedications', error);
    return createErrorResponse(error);
  }
}

/**
 * 更新奉獻記錄
 * API: updateDedication
 * 權限: finance_staff 或 treasurer（且是該任務的負責人）
 *
 * @param {object} request - 請求物件 {id, titheTaskId, donor, category, amount, date, notes}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function updateDedication(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入
    const validation = validateInput(request, {
      id: { required: true, type: 'string' },
      titheTaskId: { required: true, type: 'string' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    // 檢查任務是否存在
    const titheDAO = new TitheDAO();
    const task = titheDAO.findById(request.titheTaskId);

    if (!task) {
      throw new Error('NOT_FOUND|找不到奉獻任務');
    }

    // 檢查任務狀態
    if (task.status === TITHE_STATUS.COMPLETED) {
      throw new Error('INVALID_OPERATION|任務已完成，無法修改記錄');
    }

    // 檢查使用者是否為該任務的負責人
    const isTaskOwner =
      task.treasurerUid === user.id ||
      task.financeStaffUid === user.id ||
      user.roles.includes(USER_ROLES.ADMIN);

    if (!isTaskOwner) {
      throw new Error('PERMISSION_DENIED|您不是此任務的負責人');
    }

    // 更新奉獻記錄
    const dedicationDAO = new DedicationDAO();
    const updateData = {
      '献金者': request.donor,
      '奉獻類別': request.category,
      '金額': request.amount,
      '入帳日期': request.date,
      '備註': request.notes
    };

    const dedication = dedicationDAO.update(request.id, updateData);

    if (!dedication) {
      throw new Error('NOT_FOUND|找不到奉獻記錄');
    }

    // 記錄活動
    logInfo('更新奉獻記錄', {
      taskId: request.titheTaskId,
      dedicationId: request.id,
      user: user.email
    });

    return createSuccessResponse(dedication, '奉獻記錄已更新');

  } catch (error) {
    logError('updateDedication', error);
    return createErrorResponse(error);
  }
}

/**
 * 刪除奉獻記錄
 * API: deleteDedication
 * 權限: finance_staff 或 treasurer（且是該任務的負責人）
 *
 * @param {object} request - 請求物件 {id, titheTaskId}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function deleteDedication(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入
    const validation = validateInput(request, {
      id: { required: true, type: 'string' },
      titheTaskId: { required: true, type: 'string' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    // 檢查任務是否存在
    const titheDAO = new TitheDAO();
    const task = titheDAO.findById(request.titheTaskId);

    if (!task) {
      throw new Error('NOT_FOUND|找不到奉獻任務');
    }

    // 檢查任務狀態
    if (task.status === TITHE_STATUS.COMPLETED) {
      throw new Error('INVALID_OPERATION|任務已完成，無法刪除記錄');
    }

    // 檢查使用者是否為該任務的負責人
    const isTaskOwner =
      task.treasurerUid === user.id ||
      task.financeStaffUid === user.id ||
      user.roles.includes(USER_ROLES.ADMIN);

    if (!isTaskOwner) {
      throw new Error('PERMISSION_DENIED|您不是此任務的負責人');
    }

    // 刪除奉獻記錄
    const dedicationDAO = new DedicationDAO();
    const deleted = dedicationDAO.delete(request.id);

    if (!deleted) {
      throw new Error('NOT_FOUND|找不到奉獻記錄');
    }

    // 記錄活動
    logInfo('刪除奉獻記錄', {
      taskId: request.titheTaskId,
      dedicationId: request.id,
      user: user.email
    });

    return createSuccessResponse({ id: request.id }, '奉獻記錄已刪除');

  } catch (error) {
    logError('deleteDedication', error);
    return createErrorResponse(error);
  }
}

/**
 * 完成奉獻任務
 * API: completeTitheTask
 * 權限: finance_staff 或 treasurer（且是該任務的負責人）
 *
 * @param {object} request - 請求物件 {id}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function completeTitheTask(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入
    const validation = validateInput(request, {
      id: { required: true, type: 'string' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    // 檢查任務是否存在
    const titheDAO = new TitheDAO();
    const task = titheDAO.findById(request.id);

    if (!task) {
      throw new Error('NOT_FOUND|找不到奉獻任務');
    }

    // 檢查任務狀態
    if (task.status === TITHE_STATUS.COMPLETED) {
      throw new Error('INVALID_OPERATION|任務已完成');
    }

    // 檢查使用者是否為該任務的負責人
    const isTaskOwner =
      task.treasurerUid === user.id ||
      task.financeStaffUid === user.id ||
      user.roles.includes(USER_ROLES.ADMIN);

    if (!isTaskOwner) {
      throw new Error('PERMISSION_DENIED|您不是此任務的負責人');
    }

    // 計算統計資料
    const dedicationDAO = new DedicationDAO();
    const stats = dedicationDAO.getTaskStatistics(request.id);

    // 完成任務
    const completedTask = titheDAO.completeTask(
      request.id,
      stats.totalAmount,
      stats.totalCount
    );

    // 記錄活動
    logInfo('完成奉獻任務', {
      taskId: request.id,
      totalAmount: stats.totalAmount,
      totalCount: stats.totalCount,
      user: user.email
    });

    return createSuccessResponse(
      { task: completedTask, statistics: stats },
      '奉獻任務已完成'
    );

  } catch (error) {
    logError('completeTitheTask', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得奉獻統計資料
 * API: getTitheStatistics
 * 權限: finance_staff 或 treasurer
 *
 * @param {object} request - 請求物件 {titheTaskId}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getTitheStatistics(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入
    const validation = validateInput(request, {
      titheTaskId: { required: true, type: 'string' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    const dedicationDAO = new DedicationDAO();
    const stats = dedicationDAO.getTaskStatistics(request.titheTaskId);

    return createSuccessResponse(stats);

  } catch (error) {
    logError('getTitheStatistics', error);
    return createErrorResponse(error);
  }
}

// --- ▲▲▲ TitheAPI.gs 結束 ▲▲▲ ---
