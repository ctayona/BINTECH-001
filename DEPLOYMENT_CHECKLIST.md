# Admin Accounts Archival Feature - Deployment Checklist

## 🚀 Pre-Deployment Checklist

### Phase 1: Database Setup
- [ ] **Apply SQL Migration**
  - [ ] Open Supabase SQL Editor
  - [ ] Copy SQL from `SQL_MIGRATION_REFERENCE.md`
  - [ ] Paste into editor
  - [ ] Click "Run"
  - [ ] Verify "Query executed successfully"

- [ ] **Verify Table Creation**
  - [ ] Run: `SELECT * FROM information_schema.tables WHERE table_name = 'admin_accounts_archive_history';`
  - [ ] Verify 1 row returned

- [ ] **Verify Columns**
  - [ ] Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_accounts_archive_history';`
  - [ ] Verify 8 columns: archive_id, admin_id, email, archived_at, archived_by_email, archive_reason, previous_role, snapshot

- [ ] **Verify Indexes**
  - [ ] Run: `SELECT indexname FROM pg_indexes WHERE tablename = 'admin_accounts_archive_history';`
  - [ ] Verify 3 indexes: primary key + 2 custom indexes

- [ ] **Test Insert**
  - [ ] Run test insert query
  - [ ] Verify "INSERT 0 1" response

### Phase 2: Backend Deployment
- [ ] **Code Review**
  - [ ] Review `controllers/adminController.js` changes
  - [ ] Verify 4 new functions added
  - [ ] Check authorization logic
  - [ ] Check error handling

- [ ] **Deploy Backend**
  - [ ] Commit changes: `git add controllers/adminController.js`
  - [ ] Commit message: "Add admin account archival API functions"
  - [ ] Push to repository: `git push`
  - [ ] Verify deployment successful

- [ ] **Test API Endpoints**
  - [ ] Test: `POST /admin/accounts/:id/archive`
  - [ ] Test: `GET /admin/accounts/archive-history`
  - [ ] Test: `GET /admin/accounts/archive-history/:archive_id`
  - [ ] Test: `POST /admin/accounts/archive-history/:archive_id/restore`

### Phase 3: Frontend Deployment
- [ ] **Code Review**
  - [ ] Review `templates/ADMIN_ACCOUNTS.html` changes
  - [ ] Verify UI components added
  - [ ] Verify JavaScript functions added
  - [ ] Check modal functionality
  - [ ] Check tab switching

- [ ] **Deploy Frontend**
  - [ ] Commit changes: `git add templates/ADMIN_ACCOUNTS.html`
  - [ ] Commit message: "Add admin account archival UI components"
  - [ ] Push to repository: `git push`
  - [ ] Verify deployment successful

- [ ] **Test UI Components**
  - [ ] Archive History tab appears
  - [ ] Archive button visible on admin rows
  - [ ] Archive modal opens correctly
  - [ ] Snapshot modal displays data
  - [ ] Restore modal opens correctly

### Phase 4: Integration Testing
- [ ] **Test Archive Workflow**
  - [ ] Log in as Head admin
  - [ ] Go to Account Management → Admins
  - [ ] Click Archive on an admin account
  - [ ] Enter optional reason
  - [ ] Confirm archive
  - [ ] Verify account disappears from active list
  - [ ] Verify success notification appears

- [ ] **Test Archive History**
  - [ ] Click Archive History tab
  - [ ] Verify archived account appears in table
  - [ ] Test search functionality
  - [ ] Verify correct columns displayed

- [ ] **Test Snapshot Viewing**
  - [ ] Click "View" button on archived account
  - [ ] Verify snapshot modal opens
  - [ ] Verify all account data displayed
  - [ ] Verify archive metadata shown
  - [ ] Verify "Restore Account" button present

- [ ] **Test Restore Workflow**
  - [ ] Click "Restore" button
  - [ ] Enter optional reason
  - [ ] Confirm restore
  - [ ] Verify account reappears in active list
  - [ ] Verify success notification appears

- [ ] **Test Authorization**
  - [ ] Log in as regular Admin (not Head)
  - [ ] Verify cannot see Archive button
  - [ ] Verify can view Archive History
  - [ ] Verify cannot restore accounts

- [ ] **Test Error Handling**
  - [ ] Try to archive own account (should fail)
  - [ ] Try to archive Head account (should fail)
  - [ ] Try to restore with email conflict (should fail)
  - [ ] Verify error messages display correctly

### Phase 5: Performance Testing
- [ ] **Archive Operation**
  - [ ] Measure time to archive account
  - [ ] Verify < 500ms

- [ ] **Load Archive History**
  - [ ] Measure time to load 50 records
  - [ ] Verify < 1s

- [ ] **View Snapshot**
  - [ ] Measure time to load snapshot
  - [ ] Verify < 200ms

- [ ] **Restore Operation**
  - [ ] Measure time to restore account
  - [ ] Verify < 500ms

### Phase 6: Security Testing
- [ ] **Authorization Checks**
  - [ ] Verify only Head can archive
  - [ ] Verify only Head can restore
  - [ ] Verify Admin can view history
  - [ ] Verify cannot archive own account
  - [ ] Verify cannot archive Head accounts

- [ ] **Data Protection**
  - [ ] Verify archive history is immutable
  - [ ] Verify snapshots contain full data
  - [ ] Verify email conflicts prevented
  - [ ] Verify audit trail maintained

- [ ] **API Security**
  - [ ] Verify authorization headers checked
  - [ ] Verify input validation works
  - [ ] Verify error messages don't leak info

### Phase 7: Documentation Review
- [ ] **Check Documentation**
  - [ ] Review `SUPABASE_MIGRATION_INSTRUCTIONS.md`
  - [ ] Review `SQL_MIGRATION_REFERENCE.md`
  - [ ] Review `ADMIN_ACCOUNTS_ARCHIVAL_IMPLEMENTATION.md`
  - [ ] Review `ADMIN_ARCHIVAL_QUICK_REFERENCE.md`
  - [ ] Verify all links work
  - [ ] Verify all examples are correct

- [ ] **Update README**
  - [ ] Add archival feature to feature list
  - [ ] Add link to documentation
  - [ ] Update deployment instructions

### Phase 8: Monitoring Setup
- [ ] **Set Up Logging**
  - [ ] Verify backend logs archive operations
  - [ ] Verify error logging works
  - [ ] Check log format

- [ ] **Set Up Alerts**
  - [ ] Alert on archive failures
  - [ ] Alert on restore failures
  - [ ] Alert on authorization failures

- [ ] **Monitor Performance**
  - [ ] Monitor archive operation times
  - [ ] Monitor query performance
  - [ ] Monitor table growth

### Phase 9: User Communication
- [ ] **Notify Users**
  - [ ] Send email to admins about new feature
  - [ ] Include link to quick reference guide
  - [ ] Explain how to use feature

- [ ] **Update Help Documentation**
  - [ ] Add archival feature to help docs
  - [ ] Add screenshots if possible
  - [ ] Add troubleshooting section

### Phase 10: Final Verification
- [ ] **Smoke Test**
  - [ ] Archive an account
  - [ ] View archive history
  - [ ] View snapshot
  - [ ] Restore account
  - [ ] Verify all operations work

- [ ] **Regression Testing**
  - [ ] Verify existing features still work
  - [ ] Verify no performance degradation
  - [ ] Verify no new errors in logs

- [ ] **Sign-Off**
  - [ ] Get approval from project lead
  - [ ] Get approval from QA
  - [ ] Get approval from security team

---

## 📋 Rollback Plan

If issues occur:

1. **Immediate Rollback**
   - Revert frontend code: `git revert <commit>`
   - Revert backend code: `git revert <commit>`
   - Push changes

2. **Database Rollback**
   - Drop table: `DROP TABLE public.admin_accounts_archive_history;`
   - Or restore from backup

3. **Communication**
   - Notify users of rollback
   - Explain issue
   - Provide timeline for fix

---

## 🎯 Success Criteria

- ✅ All tests pass
- ✅ No performance degradation
- ✅ No security issues
- ✅ All documentation complete
- ✅ Users can archive accounts
- ✅ Users can restore accounts
- ✅ Audit trail maintained
- ✅ No errors in logs

---

## 📞 Support Contacts

- **Backend Issues**: [Backend Team]
- **Frontend Issues**: [Frontend Team]
- **Database Issues**: [DBA Team]
- **Security Issues**: [Security Team]

---

## 📝 Sign-Off

- [ ] **Developer**: _________________ Date: _______
- [ ] **QA Lead**: _________________ Date: _______
- [ ] **Project Lead**: _________________ Date: _______
- [ ] **Security Lead**: _________________ Date: _______

---

## 🎉 Deployment Complete!

Once all checkboxes are checked, the feature is successfully deployed and ready for production use.

**Deployment Date**: _______________
**Deployed By**: _______________
**Approved By**: _______________
