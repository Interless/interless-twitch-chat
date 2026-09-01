# GitHub repository setup

Remote repository не создаётся этим проектом автоматически. После выбора имени, visibility и лицензии:

1. Создайте пустой GitHub repository без README/license/gitignore.
2. Добавьте remote и выполните первый push только после явного подтверждения владельца.
3. В `Settings → Branches` или Rulesets защитите `main`:
   - require a pull request before merging;
   - require at least one approval;
   - dismiss stale approvals after new commits;
   - require status check `Verify and build`;
   - require conversation resolution;
   - block force pushes and deletions;
   - не разрешать bypass без операционной необходимости.
4. Включите Dependabot alerts и security updates.
5. Включите private vulnerability reporting для public repository.
6. Для merge strategy оставьте `Squash merging`, если хотите линейную историю Conventional Commits.

GitHub Free поддерживает Actions, Dependabot и базовый PR workflow. Доступность отдельных ruleset/branch-protection возможностей зависит от visibility и текущего тарифа, поэтому настройки нужно проверить в UI после создания remote.
