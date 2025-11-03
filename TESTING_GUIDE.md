# 🚀 QUICK START GUIDE - Testing Merged UI/UX

## ⚡ Chạy Development Server

```powershell
npm run dev
```

Sau đó mở trình duyệt tại: `http://localhost:5173`

---

## ✅ QUICK TEST CHECKLIST (5 phút)

### 1️⃣ Test Navigation (2 phút)

1. **Header dropdowns:**

   - Hover vào "Thuê phương tiện" → Xem submenu
   - Hover vào "Thuê thiết bị" → Xem submenu
   - Click "Blog" → Navigate to blog page

2. **New pages:**
   - Visit `/equipment` ✅
   - Visit `/combos` ✅
   - Visit `/blog` ✅

### 2️⃣ Test New Components (2 phút)

1. **Equipment page:**
   - Filters hoạt động
   - Click vào 1 equipment → Xem detail page
2. **Combo page:**

   - Time filters hoạt động
   - Click vào 1 combo → Xem detail page

3. **Blog page:**
   - Search hoạt động
   - Category filter hoạt động
   - Click vào 1 article → Xem detail page

### 3️⃣ Test Authentication (1 phút) ⚠️ QUAN TRỌNG

1. **Login:**

   - Click "Đăng nhập"
   - Enter credentials
   - Verify user profile shows correctly

2. **Protected routes:**

   - Try to access `/profile` while logged out
   - Should redirect to home

3. **Logout:**
   - Click logout
   - Verify redirected to home

---

## 🐛 Expected Warnings (Safe to Ignore)

```
Warning: 'React' is declared but its value is never read.
```

→ This is normal in React 17+ (React không cần import explicit)

---

## ⚠️ Potential Issues to Watch

### If navigation dropdowns don't work:

- Check browser console for errors
- Verify icons imported correctly
- Check `showVehicleSubmenu` and `showEquipmentSubmenu` states

### If routes show 404:

- Check App.tsx routes are correct
- Verify component imports
- Check URL paths match exactly

### If authentication fails:

- **CRITICAL:** This should NOT happen
- Check if backend API is running
- Check if cookies are being sent
- Verify token refresh is still working

---

## 📊 Success Criteria

✅ All navigation works
✅ All new pages load
✅ No console errors
✅ Authentication still works
✅ User can navigate between all pages

---

## 🆘 If Something Breaks

### Authentication Issues:

Check these files haven't been modified incorrectly:

- `src/utils/auth.ts`
- `src/App.tsx` (auth logic section)

### Navigation Issues:

Check:

- `src/components/Header.tsx`
- `src/App.tsx` (routes section)

### Display Issues:

Check:

- `src/index.css`
- Browser console for CSS errors

---

## 📞 Contact

If you encounter any issues during testing:

1. Check browser console for errors
2. Check terminal for build errors
3. Review `MERGE_COMPLETED.md` for details

---

**Happy Testing! 🎉**
