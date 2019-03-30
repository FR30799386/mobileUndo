SELECT CONCAT('[[Special:Diff/', rev_id, ']]') AS 'edit', rev_timestamp, rev_user_text, rev_comment
FROM revision_compat
WHERE rev_comment LIKE '%[[w:en:User:FR30799386/undo|mobileUndo]]%'
ORDER BY rev_id DESC
LIMIT 100;